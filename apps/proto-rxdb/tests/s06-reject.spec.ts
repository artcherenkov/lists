import { test, expect } from "@playwright/test";
import { browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("6. отказ по одной правке: очередь идёт дальше, клиент узнаёт, правка откатывается", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const a = await A.p("addItem", { title: "A", rating: 2 });
  const b = await A.p("addItem", { title: "B" });
  await queueEmpty(A);
  await A.offline();
  await A.p("updateItem", a, { note: "ok 1" });
  await A.p("updateItem", b, { rating: 9 }); // дома оценка от 1 до 5: сервер откажет
  const c = await A.p("addItem", { title: "C" });
  const bad = await A.p("addItem", { title: "Bad kind", kind: "tape" }); // отказ в создании
  await A.online();
  await queueEmpty(A);
  expect((await pg("select note from items where id=$1", [a]))[0].note).toBe("ok 1");
  expect(await pg("select 1 from items where id=$1", [c])).toHaveLength(1);
  expect(await pg("select 1 from items where id=$1", [bad])).toHaveLength(0);
  const rej = await A.p("rejections");
  console.log(`[${info.project.name}] отказы:`, JSON.stringify(rej.map((r: any) => [r.coll, r.reason])));
  expect(rej.map((r: any) => r.reason).sort()).toEqual(["bad kind", "bad rating"]);
  await until(() => A.item(b), (v) => v?.rating == null, 10_000, "rating rolled back");
  expect(await A.item(bad)).toBeNull();
  expect((await A.item(a)).note).toBe("ok 1");
  await A.kill();
});
