import { expect, test } from "@playwright/test";
import { execSync } from "node:child_process";
import { admin, COMPOSE, Device, queueEmpty, resetVersions, serverItem, sql, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

const psql = (args: string, input?: string) =>
  execSync(`${COMPOSE} exec -T own-postgres ${args}`, { input, maxBuffer: 256 * 1024 * 1024 }).toString();
const backup = () => psql("pg_dump -U postgres --clean --if-exists app");
const restore = (dump: string) => psql("psql -U postgres -v ON_ERROR_STOP=1 -q app", dump);
const serverEpoch = async (): Promise<string> => (await sql("SELECT value FROM settings WHERE key = 'epoch'"))[0].value;
const browserOf = (info: any) => info.project.name as "chromium";

// Повторное ревью исправления F2: восстановление базы из копии на стыке с другими механизмами устройства.
// Общее ожидание – то же, что у r2: запись, созданная после копии, и её правка возвращаются на сервер и не пропадают с устройства.

// Устройство при восстановлении отправляет каждую строку полной правкой и снимает правки, вошедшие в неё. Если не снимать,
// частичная правка уйдёт раньше полной на сервер, который записи не знает, и получит отказ: человек увидит «правка отклонена»
// на правке, которую сам ничем не нарушил. Запись возвращается полной правкой, поэтому конечное состояние – как у r2, и
// без проверки отказов эту строку не защищает ни один тест.
test("после восстановления базы из копии устройство не показывает человеку отказ на его правку", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(browserOf(info), "A", { user });
  await a.start();
  await a.proto("createItem", { kind: "film", title: "До копии" });
  await queueEmpty(a);
  const dump = backup();

  const lost: string = await a.proto("createItem", { kind: "film", title: "Создана после копии", rating: 3 });
  await queueEmpty(a);
  await a.offline();
  await a.proto("editItem", lost, { rating: 9 });

  restore(dump);
  await admin("/admin/new-epoch");

  await a.online();
  await until(() => serverItem(lost), (r) => r?.title === "Создана после копии" && r?.rating === 9, "запись с правкой вернулась на сервер");
  await queueEmpty(a);
  expect(await a.rejections()).toEqual([]);
  expect(await a.item(lost)).toMatchObject({ title: "Создана после копии", rating: 9 });
  await a.kill();
});

// Запись, которую упавший шаг перевода скрыл на устройстве, при восстановлении не пересылается: её строка не текущей версии.
// После исправленной сборки её правка уходит частичной на сервер, который записи не знает, получает отказ, и запись удаляется
// с устройства вместе с отказом – записи нет нигде. Условия: шаг упал на записи (решение 20), базу восстановили из копии
// (выкладка плохой версии с откатом – обычная причина восстановления), запись создана после копии.
test("после восстановления базы из копии запись, скрытая упавшим шагом перевода, возвращается на сервер после исправленной сборки", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(browserOf(info), "A", { user, dv: 1 });
  await a.start();
  await a.proto("createItem", { kind: "film", title: "До копии" });
  await queueEmpty(a);
  const dump = backup();

  const stuck: string = await a.proto("createItem", { kind: "film", title: "FAIL-после копии", rating: 8 });
  await queueEmpty(a);
  await a.offline();
  await a.proto("editItem", stuck, { rating: 6 }); // неотправленная правка записи, которой нет в копии

  await a.restart({ dv: 3, faultyStep: true }); // шаг 2→3 падает на названии с FAIL: запись скрыта в версии 2
  expect((await a.item(stuck)).dv).toBe(2);

  restore(dump);
  await admin("/admin/new-epoch");
  await admin("/admin/deploy", { to: 3 });
  const epoch = await serverEpoch();
  await a.online();
  await until(() => a.eval(() => (window as any).proto.db.meta.get("epoch")), (m) => m?.value === epoch, "устройство заметило восстановление");

  await a.restart({ dv: 3, faultyStep: false }); // исправленная сборка
  await until(() => serverItem(stuck), (r) => r?.title === "FAIL-после копии", "скрытая запись вернулась на сервер").catch(async (error) => {
    throw new Error(`${error.message}; устройство: ${JSON.stringify(await a.item(stuck))}; отказы: ${JSON.stringify(await a.rejections())}`);
  });
  expect(await serverItem(stuck)).toMatchObject({ rating: 3, dv: 3 });
  expect(await a.item(stuck)).toMatchObject({ title: "FAIL-после копии", rating: 3, dv: 3 });
  await a.kill();
});

// F4 закрыт для ответа на отправку и для загрузки, но не для обработки восстановления: старая вкладка-лидер при сбросе
// пишет в очередь и в метаданные копии, которую другая вкладка уже перевела. Её цикл запоминает новую эпоху и строк копии
// текущей версии не находит (они версии 2), поэтому ничего не пересылает; новая вкладка, став лидером, эпоху уже помнит
// и сброса не увидит – запись после копии остаётся только на устройстве, и никто её на сервер не отправит.
test("старая вкладка-лидер, заметившая восстановление базы, не лишает новую вкладку отправки записей на сервер", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const d = Device.create(browserOf(info), "A", { user, dv: 1 });
  await d.start();
  const old = d.page;
  await d.proto("createItem", { kind: "film", title: "До копии" });
  await queueEmpty(d);
  const dump = backup();

  const lost: string = await d.proto("createItem", { kind: "film", title: "Создана после копии", rating: 4 });
  await queueEmpty(d);

  await d.offline();
  restore(dump);
  await admin("/admin/new-epoch");
  const fresh = await d.newTab({ dv: 2 }); // новая сборка переводит копию, старая вкладка остаётся лидером
  expect(await d.item(lost, fresh)).toMatchObject({ dv: 2 });

  await d.online();
  await until(() => d.status(old), (s) => s.copyNewer, "старая вкладка столкнулась с копией новее себя");
  await admin("/admin/deploy", { to: 2 });
  await old.close(); // отправку берёт новая вкладка
  d.page = fresh;

  await until(() => serverItem(lost), (r) => r?.title === "Создана после копии", "запись после копии вернулась на сервер").catch(async (error) => {
    throw new Error(`${error.message}; устройство: ${JSON.stringify(await d.item(lost, fresh))}; эпоха устройства: ${JSON.stringify(await d.eval(() => (window as any).proto.db.meta.get("epoch"), undefined, fresh))}, сервера: ${await serverEpoch()}`);
  });
  await queueEmpty(d);
  await d.kill();
});
