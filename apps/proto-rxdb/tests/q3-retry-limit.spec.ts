import { test, expect } from "@playwright/test";
import { admin, browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);
test.afterEach(async () => { await admin("/dev/fail", { clear: true }); });

test("q3. застрявшая правка (сервер отвечает 500) не блокирует очередь вечно: после предела откатывается и пишется отказ", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user, extra: "retry=150&limit=4" }).start();
  const p = await A.p("addItem", { title: "Poison" });
  const q = await A.p("addItem", { title: "Fine" });
  await queueEmpty(A);
  await admin("/dev/fail", { poison: [p] });
  await A.p("updateItem", p, { note: "never accepted" });
  await A.p("updateItem", q, { note: "accepted" });
  const bad = await A.p("addItem", { title: "Poison create" });
  await admin("/dev/fail", { poison: [bad] });
  await until(() => A.p("rejections"), (r) => r.length === 2, 20_000, "gave up");
  const rej = await A.p("rejections");
  console.log(`[${info.project.name}] отказы по пределу:`, JSON.stringify(rej.map((r: any) => r.reason)));
  expect(rej.every((r: any) => r.reason.startsWith("gave up after 4 attempts"))).toBe(true);
  expect((await pg("select note from items where id=$1", [q]))[0].note).toBe("accepted");
  expect((await pg("select note from items where id=$1", [p]))[0].note).toBeNull();
  await until(() => A.item(p), (v) => v?.note == null, 10_000, "rolled back");
  expect(await A.item(bad)).toBeNull();
  await queueEmpty(A);
  await A.kill();
});
