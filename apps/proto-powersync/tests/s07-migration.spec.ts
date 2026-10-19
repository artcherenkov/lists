import { test, expect } from "@playwright/test";

import { admin, Device, opsLog, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";

test.afterEach(async () => {
  await admin("/admin/fail", { mode: "none" });
  await admin("/admin/settings", { min: 1, cur: 1 });
});
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";

test("7. обновление без сети: копия и очередь переводятся, перевод не правка, список не пуст", async ({}, info) => {
  const user = uid();
  await admin("/admin/settings", { min: 1, cur: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 8 });
  const y = await A.p("addItem", { kind: "film", title: "Y", rating: 10 });
  const z = await A.p("addItem", { kind: "film", title: "Z" });
  const u = await A.p("addItem", { kind: "film", title: "Untouched", rating: 7 });
  await queueEmpty(A);
  await until(
    () => pg("select count(*)::int n from items where user_id=$1", [user]),
    (r) => r[0].n === 4,
  );
  const serverBefore = await pg(
    "select id,rating,dv,updated_at from items where user_id=$1 order by title",
    [user],
  );

  await A.offline();
  await A.p("updateItem", x, { rating: 6 }); // правка в очереди
  const n = await A.p("addItem", { kind: "film", title: "New", rating: 10 }); // создание в очереди
  const queueBefore = await A.crud();
  expect(queueBefore).toHaveLength(2);

  // «обновление приложения» без сети: версия данных 2
  await A.kill();
  await A.start({ dv: 2 });
  const rating = async (id: string) => (await A.item(id))?.rating;
  const sdkRating = async (id: string) =>
    (await A.p("sql", "select rating, dv from items where id=?", [id]))[0];
  await until(
    () => rating(u),
    (v) => v === 4,
    10_000,
    "copy translated in TanStack collection (7 -> 4)",
  );
  expect(await rating(y)).toBe(5);
  expect(await rating(x)).toBe(3); // локальная правка 6 -> 3
  expect(await rating(z)).toBeNull();
  expect(await rating(n)).toBe(5); // создание без сети 10 -> 5
  expect(await sdkRating(u)).toEqual({ rating: 4, dv: 2 });
  expect((await A.rows()).items.length).toBe(5); // список не пуст
  const queueAfter = await A.crud();
  console.log(
    `[${info.project.name}] очередь до:`,
    JSON.stringify(queueBefore.map((c: any) => [c.op, c.data])),
    "после:",
    JSON.stringify(queueAfter.map((c: any) => [c.op, c.data, c.metadata])),
  );
  expect(queueAfter).toHaveLength(2); // перевод не добавил правок
  expect(queueAfter[0].data.rating).toBe(3);
  expect(queueAfter[1].data.rating).toBe(5);
  expect(JSON.parse(queueAfter[0].metadata).dv).toBe(2);
  expect(Object.keys(queueAfter[0].data).sort()).toEqual(["rating", "updated_at"]);

  // выкладка сервера: версия 2, одна транзакция
  await admin("/admin/migrate-2");
  await opsLog();
  await A.online();
  await queueEmpty(A);
  const ops = await opsLog();
  console.log(
    `[${info.project.name}] на сервер ушло:`,
    JSON.stringify(
      ops.map((o) => [o.dv, o.op, o.id === x ? "X" : o.id === n ? "N" : o.id, o.fields]),
    ),
  );
  expect(ops.map((o) => o.id).sort()).toEqual([x, n].sort()); // ничего лишнего: нетронутые записи не уходили
  expect(ops.every((o) => o.dv === 2)).toBe(true);
  const serverAfter = await pg(
    "select id,title,rating,dv,updated_at from items where user_id=$1 order by title",
    [user],
  );
  expect(serverAfter.find((r) => r.id === u)).toMatchObject({ rating: 4, dv: 2 });
  expect(serverAfter.find((r) => r.id === u)!.updated_at).toBe(
    serverBefore.find((r) => r.id === u)!.updated_at,
  ); // «изменена» шаг не трогает
  expect(serverAfter.find((r) => r.id === x)).toMatchObject({ rating: 3, dv: 2 });
  expect(serverAfter.find((r) => r.id === n)).toMatchObject({ rating: 5, dv: 2 });
  // копия сошлась с сервером
  await sleep(1500);
  for (const r of serverAfter) expect([r.title, await rating(r.id)]).toEqual([r.title, r.rating]);
  await A.kill();
});

test("7b. загрузка стоит, пока идёт перевод: disconnect останавливает приём", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 8 });
  await queueEmpty(A);
  await A.p("disconnect");
  expect(await A.eval(() => (window as any).proto.db.currentStatus.connected)).toBe(false);
  await pg("update items set title='server-change' where id=$1", [x]);
  await sleep(2500);
  expect((await A.item(x))?.title).toBe("X"); // ничего не приехало
  expect((await A.crud()).length).toBe(0);
  await A.p("connect");
  await until(
    () => A.item(x),
    (v) => v?.title === "server-change",
    15_000,
    "arrives after reconnect",
  );
  await A.kill();
});
