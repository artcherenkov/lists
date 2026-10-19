import { test, expect } from "@playwright/test";

import { admin, Device, pg, queueEmpty, uid, until } from "./helpers.ts";

test.afterEach(async () => {
  await admin("/admin/fail", { mode: "none" });
});
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";

test("6. отказ одной правки: очередь идёт дальше, клиент узнаёт, правка откатывается", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 3 });
  const y = await A.p("addItem", { kind: "film", title: "Y", status: "want" });
  await queueEmpty(A);
  await A.offline();
  await A.p("updateItem", x, { rating: 99 }); // сервер отклонит
  await A.p("updateItem", y, { status: "watched" });
  const z = await A.p("addItem", { kind: "film", title: "Z" });
  const w = await A.p("addItem", { kind: "bogus", title: "W" }); // отклонённое создание
  await A.p("setSeason", w, 1, "watched"); // зависит от отклонённого создания
  expect((await A.item(x))?.rating).toBe(99);
  await A.online();
  const t0 = Date.now();
  await queueEmpty(A);
  const tQueue = Date.now() - t0;
  await until(
    () => A.item(x),
    (v) => v?.rating === 3,
    20_000,
    "X rolled back",
  );
  const tRollback = Date.now() - t0;
  await until(
    () => A.item(w),
    (v) => !v,
    20_000,
    "W removed",
  );
  await until(
    () => A.season(`${w}:1`),
    (v) => !v,
    20_000,
    "season of W removed",
  );
  const rej = await A.rejections();
  console.log(
    `[${info.project.name}] очередь ушла за ${tQueue} мс, откат за ${tRollback} мс; отказы:`,
    JSON.stringify(rej.map((r: any) => [r.table_name, r.op, r.error])),
  );
  expect(rej).toHaveLength(3);
  expect((await pg("select status from items where id=$1", [y]))[0].status).toBe("watched");
  expect(await pg("select 1 from items where id=$1", [z])).toHaveLength(1);
  expect(await pg("select 1 from items where id=$1", [w])).toHaveLength(0);
  expect((await pg("select rating from items where id=$1", [x]))[0].rating).toBe(3);
  await A.kill();
});

test("6b. контроль: ответ 5xx держит очередь (повтор каждые 0,5 с), 2xx с отказом – нет", async ({}, info) => {
  const A = Device.create(browserOf(info), "A", { user: uid() });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X" });
  await queueEmpty(A);
  await admin("/admin/fail", { mode: "500" });
  await A.p("updateItem", x, { status: "watched" });
  await A.p("addItem", { kind: "film", title: "Second" });
  await new Promise((r) => setTimeout(r, 3000));
  const q = await A.crud();
  expect(q.length).toBe(2);
  await admin("/admin/fail", { mode: "none" });
  await queueEmpty(A);
  await A.kill();
});
