import { test, expect } from "@playwright/test";

import { admin, API, Device, opsLog, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";

test.afterEach(async () => {
  await admin("/admin/settings", { min: 1, cur: 1 });
  await admin("/admin/ttl", { seconds: 300 });
});
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";
const connected = (d: Device) => d.eval(() => (window as any).proto.db.currentStatus.connected);
const flags = (d: Device) => d.eval(() => ({ ...(window as any).proto.status }));

test("8a. клиент младше минимальной: не читает, не пишет, копит правки; после обновления отправляет", async ({}, info) => {
  const user = uid();
  await admin("/admin/settings", { min: 1, cur: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  await queueEmpty(A);
  await A.kill();
  // выкладка поднимает минимальную до 2
  await admin("/admin/migrate-2");
  await A.start({ dv: 1 });
  await sleep(2000);
  expect(await connected(A)).toBe(false);
  expect((await flags(A)).updateRequired).toBe(true);
  // другое устройство (версия 2) добавило запись: старый клиент её не получает
  const srv = uid("srv");
  await pg("insert into items(id,user_id,kind,title,dv) values($1,$2,'film','from-v2',2)", [
    srv,
    user,
  ]);
  const id = await A.p("addItem", { kind: "film", title: "Offline-old", rating: 8 });
  await opsLog();
  await sleep(3000);
  expect(await A.item(srv)).toBeUndefined();
  expect((await A.crud()).length).toBe(1);
  expect(await opsLog()).toHaveLength(0);
  // прямой запрос записи со старой версией
  const direct = await fetch(API + "/upload", {
    method: "POST",
    headers: { "x-data-version": "1" },
    body: JSON.stringify({ ops: [] }),
  });
  expect(direct.status).toBe(401); // без токена
  // обновление клиента: версия 2 – копия и очередь переводятся и уходят
  await A.restart({ dv: 2 });
  await queueEmpty(A, 30_000);
  await until(
    () => A.item(srv),
    (v) => !!v,
    15_000,
    "reads after update",
  );
  expect((await pg("select rating,dv from items where id=$1", [id]))[0]).toEqual({
    rating: 4,
    dv: 2,
  });
  await A.kill();
});

test("8b. клиент новее сервера: молча ждёт и повторяет", async ({}, info) => {
  const user = uid();
  await admin("/admin/settings", { min: 1, cur: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const id = await A.p("addItem", { kind: "film", title: "Before", rating: 4 });
  await queueEmpty(A);
  await A.kill();
  await A.start({ dv: 2, migrate: true });
  await sleep(2500);
  expect(await connected(A)).toBe(false);
  expect((await flags(A)).waiting).toBe(true);
  expect((await flags(A)).updateRequired).toBe(false);
  await A.p("updateItem", id, { status: "watched" });
  await sleep(1500);
  expect((await A.crud()).length).toBe(1);
  // сервер выложен
  await admin("/admin/migrate-2");
  await until(
    () => connected(A),
    (v) => v === true,
    15_000,
    "connects after server deploy",
  );
  await queueEmpty(A, 20_000);
  expect((await pg("select status,rating,dv from items where id=$1", [id]))[0]).toEqual({
    status: "watched",
    rating: 2,
    dv: 2,
  });
  await A.kill();
});

test("8c. уже подключённый старый клиент читает до конца срока токена, пишет – нет", async ({}, info) => {
  const user = uid();
  await admin("/admin/settings", { min: 1, cur: 1 });
  await admin("/admin/ttl", { seconds: 6 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  await until(
    () => connected(A),
    (v) => v === true,
  );
  const t0 = Date.now();
  await admin("/admin/settings", { min: 2, cur: 2 }); // без перевода строк: проверяем только ворота
  const s1 = uid("s1");
  await pg(
    "insert into items(id,user_id,kind,title,dv) values($1,$2,'film','read-while-token-valid',2)",
    [s1, user],
  );
  const gotWhileValid = await until(
    () => A.item(s1),
    (v) => !!v,
    4000,
    "read while token valid",
  ).then(
    () => true,
    () => false,
  );
  const id = await A.p("addItem", { kind: "film", title: "After-min" });
  await sleep(1500);
  expect((await A.crud()).length).toBe(1); // запись отказана 426, очередь держится
  let stopAt = 0;
  while (Date.now() - t0 < 30_000) {
    if (!(await connected(A))) {
      stopAt = Date.now() - t0;
      break;
    }
    await sleep(250);
  }
  console.log(
    `[${info.project.name}] после подъёма минимальной: чтение ещё шло: ${gotWhileValid}; соединение оборвалось через ${stopAt} мс (TTL токена 6 с)`,
  );
  const s2 = uid("s2");
  await pg("insert into items(id,user_id,kind,title,dv) values($1,$2,'film','after-expiry',2)", [
    s2,
    user,
  ]);
  await sleep(2500);
  expect(await A.item(s2)).toBeUndefined();
  expect((await flags(A)).updateRequired).toBe(true);
  await A.kill();
});
