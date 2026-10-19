import { test, expect } from "@playwright/test";
import { admin, browserOf, Device, opsLog, pg, queueEmpty, uid, until } from "./helpers.ts";

test.afterEach(async () => { await admin("/dev/settings", { min_dv: 3, cur_dv: 3 }); });

test("7. обновление без сети: копия переводится, перевод не правка, правка уходит переведённой и только тронутыми полями", async ({}, info) => {
  const user = uid();
  await admin("/dev/settings", { min_dv: 1, cur_dv: 1 });
  const A = Device.create(browserOf(info), "A", { user, dv: 1 });
  await A.start();
  const x = await A.p("addItem", { kind: "film", title: "X", rating: 8 });
  const y = await A.p("addItem", { kind: "film", title: "Y", rating: 10 });
  const z = await A.p("addItem", { kind: "film", title: "Z" });
  const u = await A.p("addItem", { kind: "film", title: "Untouched", rating: 7 });
  await queueEmpty(A);
  await until(() => pg("select count(*)::int n from items where user_id=$1", [user]), (r) => r[0].n === 4);
  const before = await pg("select id, rating, dv, updated_at from items where user_id=$1", [user]);

  await A.offline();
  await A.p("updateItem", x, { rating: 6 });
  const n = await A.p("addItem", { kind: "film", title: "New", rating: 10 });
  expect(((await A.p("queue")) as string[]).sort()).toEqual([x, n].sort());

  // обновление приложения без сети: версия данных 3, цепочка 1 -> 2 -> 3
  await A.kill();
  await A.start({ dv: 3 });
  const rating = async (id: string) => (await A.item(id))?.rating;
  expect([await rating(u), await rating(y), await rating(x), await rating(z), await rating(n)]).toEqual([4, 5, 3, null, 5]);
  expect(await A.item(u)).toMatchObject({ kind: "movie", dv: 3 });
  expect((await A.p("items")).length).toBe(5);
  const queue = ((await A.p("queue")) as string[]).sort();
  console.log(`[${info.project.name}] очередь после перевода:`, JSON.stringify(queue.map((q) => (q === x ? "X" : q === n ? "N" : q))));
  expect(queue).toEqual([x, n].sort());

  // выкладка сервера (версия 3), затем сеть
  await admin("/dev/migrate", { to: 3 });
  await opsLog();
  await A.online();
  await queueEmpty(A);
  await until(() => pg("select rating from items where id=$1", [n]), (r) => r.length === 1);
  const ops = await opsLog();
  console.log(`[${info.project.name}] на сервер ушло:`, JSON.stringify(ops.map((o) => [o.dv, o.creating ? "create" : "edit", o.id === x ? "X" : o.id === n ? "N" : o.id, o.fields])));
  expect(ops.map((o) => o.id).sort()).toEqual([x, n].sort());
  const edit = ops.find((o) => o.id === x);
  expect(edit.fields.sort()).toEqual(["rating", "updated_at"]);
  const after = await pg("select id, rating, kind, dv, updated_at from items where user_id=$1", [user]);
  const row = (id: string) => after.find((r) => r.id === id);
  expect(row(u)).toMatchObject({ rating: 4, kind: "movie", dv: 3 });
  expect(row(u).updated_at).toBe(before.find((r) => r.id === u).updated_at);
  expect(row(x)).toMatchObject({ rating: 3, dv: 3 });
  expect(row(n)).toMatchObject({ rating: 5, kind: "movie", dv: 3 });
  for (const r of after) expect(await rating(r.id)).toBe(r.rating);
  await A.kill();
});
