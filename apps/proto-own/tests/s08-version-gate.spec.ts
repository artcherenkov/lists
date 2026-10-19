import { expect, test } from "@playwright/test";
import { admin, api, Device, queueEmpty, resetVersions, serverItem, setVersions, sleep, sql, token, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);
const browserOf = (info: any) => info.project.name as "chromium";
const editsOf = async (user: string) => (await sql("SELECT count(*)::int AS n FROM applied_edits WHERE user_id = $1", [user]))[0].n;

test("8a. клиент младше минимальной версии не пишет и не читает, правки копит; после обновления они уходят", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(browserOf(info), "A", { user, dv: 1 });
  await a.start();
  await a.proto("createItem", { kind: "film", title: "До выкладки" });
  await queueEmpty(a);
  await a.kill();

  await admin("/admin/deploy", { to: 2 }); // минимальная версия теперь 2
  await a.start({ dv: 1 });
  await until(() => a.status(), (s) => s.updateRequired && !s.waiting, "старый клиент узнал, что нужно обновление");

  const b = Device.create(browserOf(info), "B", { user, dv: 2 });
  await b.start();
  const fromNew: string = await b.proto("createItem", { kind: "film", title: "С новой версии" });
  await until(() => serverItem(fromNew), (r) => !!r, "запись B на сервере");

  const old: string = await a.proto("createItem", { kind: "film", title: "Правка старого", rating: 8 });
  const editsBefore = await editsOf(user);
  await sleep(2000);
  expect(await a.item(fromNew)).toBeUndefined(); // не читает
  expect(await a.queue()).toHaveLength(1); // копит
  expect(await editsOf(user)).toBe(editsBefore); // не пишет

  for (const path of ["/api/pull?cp=0", "/api/wait?cp=0"]) {
    expect((await api(path, { token: await token(user), dv: 1 })).status).toBe(426);
  }
  expect((await api("/api/push", { token: await token(user), dv: 1, json: { edits: [] } })).status).toBe(426);
  expect((await api("/api/pull?cp=0", { token: await token(user) })).status).toBe(426); // без версии

  await a.restart({ dv: 2 });
  await queueEmpty(a);
  expect(await serverItem(old)).toMatchObject({ rating: 4, dv: 2 });
  await until(() => a.item(fromNew), (r) => !!r, "после обновления читает");
  await a.kill();
  await b.kill();
});

test("8b. клиент новее сервера молча ждёт и повторяет", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(browserOf(info), "A", { user, dv: 1 });
  await a.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "До", rating: 4 });
  await queueEmpty(a);
  await a.kill();

  await a.start({ dv: 2 }); // сервер ещё старый
  await until(() => a.status(), (s) => s.waiting, "клиент ждёт выкладки сервера");
  expect((await a.status()).updateRequired).toBe(false);
  await a.proto("editItem", id, { status: "watched" });
  await sleep(1500);
  expect(await a.queue()).toHaveLength(1);
  expect((await api("/api/pull?cp=0", { token: await token(user), dv: 2 })).status).toBe(503);

  await admin("/admin/deploy", { to: 2 });
  await queueEmpty(a, 20_000);
  expect(await serverItem(id)).toMatchObject({ status: "watched", rating: 2, dv: 2 });
  expect((await a.status()).waiting).toBe(false);
  await a.kill();
});

test("8c. правка новее клиента не уходит: рядом окно новой версии", async ({}, info) => {
  const user = uid();
  await resetVersions();
  await setVersions(1, 2);
  const a = Device.create(browserOf(info), "A", { user, dv: 2 });
  await a.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "Из окна версии 2" });
  await queueEmpty(a);
  await a.offline();
  await a.proto("editItem", id, { note: "правка версии 2" });
  await a.kill();

  // Старое окно в той же копии: копия новее, окно не пишет и не отправляет чужих правок.
  await a.start({ dv: 1 });
  expect((await a.status()).copyNewer).toBe(true);
  await a.online();
  await sleep(1500);
  expect(await a.queue()).toHaveLength(1);
  expect((await serverItem(id)).note).toBeNull();
  await a.kill();
});
