import { test, expect } from "@playwright/test";
import { admin, browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";

test.afterEach(async () => { await admin("/dev/settings", { min_dv: 3, cur_dv: 3 }); });

test("8а. клиент младше минимальной версии не пишет и не читает", async ({}, info) => {
  const user = uid();
  await admin("/dev/settings", { min_dv: 3, cur_dv: 3 });
  const B = await Device.create(browserOf(info), "B", { user, dv: 3 }).start();
  const seeded = await B.p("addItem", { title: "Seeded" });
  await queueEmpty(B);
  await admin("/dev/settings", { min_dv: 2, cur_dv: 3 });
  const A = await Device.create(browserOf(info), "A", { user, dv: 1 }).start();
  await until(() => A.p("info"), (i) => i.gate === "update-required", 10_000, "gate");
  const mine = await A.p("addItem", { kind: "film", title: "From old" });
  await new Promise((r) => setTimeout(r, 2000));
  expect(await pg("select 1 from items where id=$1", [mine])).toHaveLength(0);
  expect(await A.item(seeded)).toBeNull();
  await A.kill();
  await B.kill();
});

test("8б. клиент новее сервера ждёт и дошлёт, когда сервер догонит", async ({}, info) => {
  const user = uid();
  await admin("/dev/settings", { min_dv: 2, cur_dv: 2 });
  const A = await Device.create(browserOf(info), "A", { user, dv: 3 }).start();
  const id = await A.p("addItem", { title: "Waits" });
  await until(() => A.p("info"), (i) => i.waiting, 10_000, "waiting");
  expect(await pg("select 1 from items where id=$1", [id])).toHaveLength(0);
  expect((await A.p("info")).gate).toBe("ok");
  await admin("/dev/settings", { min_dv: 3, cur_dv: 3 });
  await queueEmpty(A);
  expect(await pg("select dv from items where id=$1", [id])).toEqual([{ dv: 3 }]);
  await A.kill();
});
