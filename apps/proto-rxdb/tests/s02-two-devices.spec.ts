import { test, expect } from "@playwright/test";
import { browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("2. правка приезжает на другое устройство в обе стороны", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const id = await A.p("addItem", { title: "From A" });
  await until(() => B.item(id), (v) => v?.title === "From A", 15_000, "A -> B");
  await B.p("updateItem", id, { status: "watched", rating: 4 });
  await until(() => A.item(id), (v) => v?.status === "watched" && v?.rating === 4, 15_000, "B -> A");
  await queueEmpty(A);
  await queueEmpty(B);
  expect((await pg("select status, rating from items where id=$1", [id]))[0]).toEqual({ status: "watched", rating: 4 });
  await A.kill();
  await B.kill();
});
