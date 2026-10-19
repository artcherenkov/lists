import { test, expect } from "@playwright/test";
import { admin, browserOf, Device, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("12а. живые обновления переживают истечение токена и обрыв сети", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user, extra: "ttl=4" }).start();
  const id = await A.p("addItem", { title: "live" });
  await until(() => B.item(id), (v) => !!v, 10_000, "first live update");
  await sleep(9000); // токен B успел истечь дважды: поток закрыт сервером и открыт заново
  await A.p("updateItem", id, { note: "after token expiry" });
  await until(() => B.item(id), (v) => v?.note === "after token expiry", 10_000, "update after expiry");
  await B.offline();
  await A.p("updateItem", id, { note: "while B offline" });
  await sleep(1500);
  expect((await B.item(id)).note).toBe("after token expiry");
  await B.online();
  await until(() => B.item(id), (v) => v?.note === "while B offline", 15_000, "catch up after reconnect");
  await A.kill();
  await B.kill();
});

test("12б. отметка раньше записи: порядок между коллекциями", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user, extra: "retry=4000" }).start();
  await A.offline();
  const times: number[] = [];
  const ids: string[] = [];
  for (let i = 0; i < 6; i++) {
    const id = await A.p("addItem", { kind: "series", title: `S${i}` });
    await A.p("setSeason", id, 1, "watching");
    ids.push(id);
  }
  const t0 = Date.now();
  await A.online();
  await until(() => pg("select count(*)::int n from seasons where user_id=$1", [user]), (r) => r[0].n === 6, 20_000, "marks");
  const took = Date.now() - t0;
  await queueEmpty(A);
  console.log(`[${info.project.name}] 12б шесть записей с отметками дошли за ${took} мс (retry 4000 мс), отметок, пришедших раньше записи: ${(await A.p("info")).later}`);
  expect((await pg("select count(*)::int n from items where user_id=$1", [user]))[0].n).toBe(6);
  await A.kill();
});

test("12в. запись задерживается, отметка идёт первой: отметка ждёт запись и уходит следом без второго повтора", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user, extra: "retry=4000&limit=50" }).start();
  const id = uid("slow");
  await admin("/dev/fail", { poison: [id] });
  await A.p("addItem", { id, kind: "series", title: "Delayed" });
  await A.p("setSeason", id, 1, "watching");
  await until(() => A.p("info"), (i) => i.later > 0, 10_000, "mark arrived before its item");
  expect(await pg("select 1 from seasons where item_id=$1", [id])).toHaveLength(0);
  await admin("/dev/fail", { clear: true });
  const t0 = Date.now();
  await until(() => pg("select 1 from seasons where item_id=$1", [id]), (r) => r.length === 1, 15_000, "mark after item");
  console.log(`[${info.project.name}] 12в отметка дошла через ${Date.now() - t0} мс после того, как записи разрешили уйти (retry 4000 мс)`);
  await queueEmpty(A);
  await A.kill();
});
