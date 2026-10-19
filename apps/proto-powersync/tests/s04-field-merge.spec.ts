import { test, expect } from "@playwright/test";
import { admin, Device, opsLog, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";

test.afterEach(async () => { await admin("/admin/fail", { mode: "none" }); });
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";
const keys = (c: any) => Object.keys(c.data ?? {}).sort();

test("4a. правка уходит только изменёнными полями (TanStack и голый SDK)", async ({}, info) => {
  const A = Device.create(browserOf(info), "A", { user: uid() });
  await A.start();
  const id = await A.p("addItem", { kind: "film", title: "T", rating: 4, status: "want", note: "n" });
  await queueEmpty(A);
  await opsLog();
  await A.offline();

  // TanStack: присвоены и неизменённое поле (title), и изменённое
  await A.p("updateItem", id, { title: "T", rating: 6 });
  let q = await A.crud();
  console.log(`[${info.project.name}] TanStack update с неизменённым title:`, JSON.stringify(q.map((c) => [c.op, keys(c)])));
  expect(keys(q[0])).toEqual(["rating", "updated_at"]);
  await A.p("exec", "DELETE FROM ps_crud");

  // голый SDK: UPDATE всей строки теми же значениями, кроме заметки
  await A.p("exec", "UPDATE items SET title=?, status=?, rating=?, note=?, kind=? WHERE id=?", ["T", "want", 6, "n2", "film", id]);
  q = await A.crud();
  console.log(`[${info.project.name}] SDK UPDATE всей строки:`, JSON.stringify(q.map((c) => [c.op, keys(c)])));
  expect(keys(q[0])).toEqual(["note"]);
  await A.kill();
});

test("4b. два устройства без сети: разные поля – оба, одно поле – последний пришедший", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  const B = Device.create(browserOf(info), "B", { user });
  await A.start();
  await B.start();
  const id = await A.p("addItem", { kind: "film", title: "M", rating: 5, status: "want" });
  await until(() => B.item(id), (v) => !!v);
  await A.offline();
  await B.offline();

  // разные поля
  await A.p("updateItem", id, { rating: 7 });
  await B.p("updateItem", id, { status: "watched" });
  await A.online();
  await queueEmpty(A);
  await B.online();
  await queueEmpty(B);
  await until(() => pg("select rating,status from items where id=$1", [id]), (r) => r[0].rating === 7 && r[0].status === "watched", 20_000, "server both");
  await until(() => A.item(id), (v) => v?.rating === 7 && v?.status === "watched", 20_000, "A converges");
  await until(() => B.item(id), (v) => v?.rating === 7 && v?.status === "watched", 20_000, "B converges");

  // одно поле: A отправила первой, B – последней => B
  await A.offline();
  await B.offline();
  await A.p("updateItem", id, { rating: 2 });
  await B.p("updateItem", id, { rating: 9 });
  await A.online();
  await queueEmpty(A);
  await B.online();
  await queueEmpty(B);
  await until(() => pg("select rating from items where id=$1", [id]), (r) => r[0].rating === 9);
  await until(() => A.item(id), (v) => v?.rating === 9, 20_000, "A takes last");

  // наоборот: правка B сделана позже по часам, но пришла раньше => побеждает пришедшая последней (A)
  await A.offline();
  await B.offline();
  await A.p("updateItem", id, { rating: 3 });
  await sleep(50);
  await B.p("updateItem", id, { rating: 8 });
  await B.online();
  await queueEmpty(B);
  await A.online();
  await queueEmpty(A);
  await until(() => pg("select rating from items where id=$1", [id]), (r) => r[0].rating === 3);
  await until(() => B.item(id), (v) => v?.rating === 3, 20_000, "B takes last");
  await A.kill();
  await B.kill();
});

test("4c. незнакомое серверу клиента поле не затирается и не теряется", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  await A.start();
  const id = await A.p("addItem", { kind: "film", title: "U", rating: 4 });
  await queueEmpty(A);
  await pg("update items set future_field='keep-me' where id=$1", [id]);
  await until(() => A.p("sql", "select json_extract(data,'$.future_field') f from ps_data__items where id=?", [id]), (r) => r[0]?.f === "keep-me", 20_000, "future_field synced into JSON");
  await A.p("updateItem", id, { title: "U2", rating: 5 });
  await queueEmpty(A);
  await until(() => pg("select title, future_field from items where id=$1", [id]), (r) => r[0].title === "U2");
  expect((await pg("select future_field from items where id=$1", [id]))[0].future_field).toBe("keep-me");
  // клиент сам пишет неизвестное серверу поле: обработчик отклоняет явно, а не отбрасывает молча
  await A.p("exec", "INSERT INTO ps_crud(tx_id,data) VALUES (999, ?)", [JSON.stringify({ op: "PATCH", type: "items", id, data: { bogus_col: 1 } })]);
  await until(async () => (await A.rejections()).length, (n) => n === 1, 20_000, "reject unknown");
  console.log(`[${info.project.name}] отклонение незнакомого поля:`, JSON.stringify((await A.rejections())[0].error));
  await A.kill();
});
