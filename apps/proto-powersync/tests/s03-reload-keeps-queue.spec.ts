import { test, expect } from "@playwright/test";

import { admin, Device, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";

test.afterEach(async () => {
  await admin("/admin/fail", { mode: "none" });
});
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";

test("3a. контроль: disconnectAndClear стирает очередь", async ({}, info) => {
  const d = Device.create(browserOf(info), "A", { user: uid() });
  await d.start();
  await d.offline();
  await d.p("addItem", { kind: "film", title: "Lost" });
  expect((await d.crud()).length).toBe(1);
  await d.p("disconnectAndClear");
  expect((await d.crud()).length).toBe(0);
  await d.kill();
});

test("3b. очередь не уходит (5xx): загрузка с сервера стоит за ней, потом догоняет", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  const B = Device.create(browserOf(info), "B", { user });
  await A.start();
  await B.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 3 });
  await until(
    () => B.item(x),
    (v) => !!v,
  );
  await queueEmpty(A);

  await admin("/admin/fail", { mode: "500" }); // обработчик записи падает
  await A.p("updateItem", x, { rating: 9 });
  expect((await A.crud()).length).toBe(1);
  // другое устройство правит другое поле и добавляет запись
  await B.p("updateItem", x, { status: "watched" });
  // B не может отправить – сервер падает для всех; пишем напрямую в Postgres от имени «другого устройства»
  await pg("update items set note='from server' where id=$1", [x]);
  const y = uid("srv");
  await pg("insert into items(id,user_id,kind,title) values($1,$2,'film','Server-made')", [
    y,
    user,
  ]);
  await sleep(4000);
  const stuck = {
    note: (await A.item(x))?.note ?? null,
    hasY: !!(await A.item(y)),
    rating: (await A.item(x))?.rating,
    queue: (await A.crud()).length,
  };
  console.log(`[${info.project.name}] 5xx: чтение стоит за очередью:`, JSON.stringify(stuck));
  expect(stuck.hasY).toBe(false);
  expect(stuck.rating).toBe(9);
  expect(stuck.queue).toBe(1);
  // сервер ожил
  await admin("/admin/fail", { mode: "none" });
  await queueEmpty(A, 30_000);
  await until(
    () => A.item(y),
    (v) => !!v,
    20_000,
    "Y arrives",
  );
  const final = await A.item(x);
  expect(final?.rating).toBe(9);
  expect(final?.note).toBe("from server");
  await A.kill();
  await B.kill();
});

test("3c. загрузка одной записи и полная перезагрузка (смена правил) с очередью: правка не теряется", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 3 });
  await queueEmpty(A);
  await until(
    async () => (await pg("select rating from items where id=$1", [x]))[0]?.rating,
    (v) => v === 3,
  );

  await admin("/admin/fail", { mode: "500" }); // очередь держится
  await A.p("updateItem", x, { rating: 9 });
  await pg("update items set rating = 5, title = 'X-server' where id=$1", [x]);

  // загрузить одну запись заново: подписка на поток с параметром id
  await A.eval(async (id) => {
    (window as any).__sub = await (window as any).proto.db
      .syncStream("item_one", { id })
      .subscribe();
    (window as any).__firstSync = false;
    (window as any).__sub.waitForFirstSync().then(() => ((window as any).__firstSync = true));
  }, x);
  await sleep(3000);
  const firstSyncWhileQueued = await A.eval(() => (window as any).__firstSync);
  console.log(
    `[${info.project.name}] waitForFirstSync при очереди разрешился: ${firstSyncWhileQueued}`,
  );
  const during = await A.item(x);
  console.log(
    `[${info.project.name}] во время загрузки одной записи при очереди:`,
    JSON.stringify({
      rating: during?.rating,
      title: during?.title,
      queue: (await A.crud()).length,
    }),
  );
  expect(during?.rating).toBe(9); // локальная правка на месте
  expect((await A.crud()).length).toBe(1);

  await admin("/admin/fail", { mode: "none" });
  await queueEmpty(A, 30_000);
  await until(
    () => A.eval(() => (window as any).__firstSync),
    (v) => v === true,
    20_000,
    "first sync after queue drained",
  );
  await until(
    () => A.item(x),
    (v) => v?.title === "X-server" && v?.rating === 9,
    20_000,
    "merged",
  );
  expect((await pg("select rating,title from items where id=$1", [x]))[0]).toEqual({
    rating: 9,
    title: "X-server",
  });
  await A.kill();
});
