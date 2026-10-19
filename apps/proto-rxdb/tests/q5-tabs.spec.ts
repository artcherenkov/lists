import { test, expect } from "@playwright/test";

import { admin, browserOf, Device, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);
test.afterEach(async () => {
  await admin("/dev/settings", { min_dv: 3, cur_dv: 3 });
});

const leaders = async (pages: any[]) => Promise.all(pages.map((p) => Device.call(p, "isLeader")));

test("q5а. две вкладки: один лидер, запись из обеих доходит, закрытие лидера передаёт синхронизацию", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const t1 = A.page;
  const t2 = await A.tab();
  await sleep(500);
  const l = await leaders([t1, t2]);
  console.log(`[${info.project.name}] лидеры вкладок:`, JSON.stringify(l));
  expect(l.filter(Boolean)).toHaveLength(1);

  // запись из двух вкладок без сети; обе вкладки видят обе записи, на сервер идёт по одному разу
  await A.offline();
  const x = await Device.call(t1, "addItem", { title: "From tab 1" });
  const y = await Device.call(t2, "addItem", { title: "From tab 2" });
  await until(
    () => Device.call(t1, "items"),
    (v) => v.length === 2,
    10_000,
    "tab 1 sees both",
  );
  await until(
    () => Device.call(t2, "items"),
    (v) => v.length === 2,
    10_000,
    "tab 2 sees both",
  );
  await A.online();
  await until(
    () => pg("select id from items where user_id=$1", [user]),
    (r) => r.length === 2,
    20_000,
    "both reached server",
  );
  expect(
    (await pg("select id from items where user_id=$1", [user])).map((r) => r.id).sort(),
  ).toEqual([x, y].sort());

  // закрыли вкладку лидера: вторая подхватывает
  const leaderPage = l[0] ? t1 : t2;
  const other = l[0] ? t2 : t1;
  await leaderPage.close();
  const z = await Device.call(other, "addItem", { title: "After leader closed" });
  await until(
    () => pg("select 1 from items where id=$1", [z]),
    (r) => r.length === 1,
    20_000,
    "new leader pushes",
  );
  expect(await Device.call(other, "isLeader")).toBe(true);
  await A.kill();
});

test("q5б. старая вкладка рядом с переведённой копией", async ({}, info) => {
  const user = uid();
  await admin("/dev/settings", { min_dv: 1, cur_dv: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const old = A.page;
  const x = await Device.call(old, "addItem", { kind: "film", title: "Before", rating: 8 });
  await queueEmpty(A);
  await until(
    () => pg("select 1 from items where id=$1", [x]),
    (r) => r.length === 1,
  );
  await admin("/dev/migrate", { to: 3 });

  const fresh = await A.tab({ dv: 3 });
  expect((await Device.call(fresh, "item", x)).rating).toBe(4);
  const infoOld = await until(
    () => Device.call(old, "info"),
    (i) => i.stale,
    10_000,
    "old tab learns",
  ).catch(() => Device.call(old, "info"));
  console.log(`[${info.project.name}] старая вкладка: ${JSON.stringify(infoOld)}`);
  const attempt = await Device.call(old, "addItem", { kind: "film", title: "From old tab" }).then(
    () => "written",
    (e: any) => `error: ${String(e).slice(0, 80)}`,
  );
  console.log(`[${info.project.name}] запись из старой вкладки: ${attempt}`);
  await sleep(2500);
  const rows = await pg("select title, kind, dv from items where user_id=$1 order by title", [
    user,
  ]);
  console.log(`[${info.project.name}] на сервере:`, JSON.stringify(rows));
  expect(rows.every((r) => r.dv === 3 && r.kind === "movie")).toBe(true);
  expect((await Device.call(fresh, "item", x)).rating).toBe(4);
  await A.kill();
});

test("q5в. старая вкладка, копию перевели, а сервер ещё на старой версии: что видит и может ли писать", async ({}, info) => {
  const user = uid();
  await admin("/dev/settings", { min_dv: 1, cur_dv: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const old = A.page;
  const x = await Device.call(old, "addItem", { kind: "film", title: "Before", rating: 8 });
  await queueEmpty(A);
  await until(
    () => pg("select 1 from items where id=$1", [x]),
    (r) => r.length === 1,
  );
  const fresh = await A.tab({ dv: 3 }); // сервер ещё на 1: новая вкладка ждёт (503)
  await until(
    () => Device.call(fresh, "info"),
    (i) => i.waiting,
    10_000,
    "fresh waits",
  );
  const infoOld = await Device.call(old, "info");
  const list = await Device.call(old, "items").then(
    (v: any[]) => `ok ${v.length}`,
    (e: any) => `error ${String(e).slice(0, 60)}`,
  );
  const write = await Device.call(old, "addItem", { kind: "film", title: "From old tab" }).then(
    () => "written",
    (e: any) => `error ${String(e).slice(0, 60).replace(/\s+/g, " ")}`,
  );
  console.log(
    `[${info.project.name}] старая вкладка при сервере на 1: info=${JSON.stringify(infoOld)}, чтение: ${list}, запись: ${write}`,
  );
  expect(infoOld.stale).toBe(true);
  expect(write.startsWith("error")).toBe(true);
  expect(await pg("select title from items where user_id=$1", [user])).toEqual([
    { title: "Before" },
  ]);
  await A.kill();
});
