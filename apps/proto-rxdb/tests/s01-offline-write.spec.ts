import { test, expect } from "@playwright/test";

import { browserOf, Device, pg, queueEmpty, uid } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("1. запись без сети переживает перезагрузку, очередь уходит", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  await A.start();
  await A.offline();
  const id = await A.p("addItem", { title: "Offline film" });
  expect(await A.p("queue")).toContain(id);
  await A.restart();
  expect((await A.item(id)).title).toBe("Offline film");
  expect(await A.p("queue")).toContain(id);
  expect(await pg("select 1 from items where id=$1", [id])).toHaveLength(0);
  await A.online();
  await queueEmpty(A);
  const rows = await pg("select title, user_id, dv from items where id=$1", [id]);
  expect(rows).toEqual([{ title: "Offline film", user_id: user, dv: 3 }]);
  await A.kill();
});

test("1б. браузер в режиме «без сети» (navigator.onLine = false): очередь уходит сразу после возврата сети, не ждёт повтора", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user, extra: "retry=8000" });
  await A.start();
  await A.ctx.setOffline(true);
  const id = await A.p("addItem", { title: "Airplane" });
  await new Promise((r) => setTimeout(r, 1500));
  expect(await pg("select 1 from items where id=$1", [id])).toHaveLength(0);
  const t0 = Date.now();
  await A.ctx.setOffline(false);
  await queueEmpty(A, 7000);
  console.log(
    `[${info.project.name}] 1б очередь ушла через ${Date.now() - t0} мс после возврата сети (retry 8000 мс)`,
  );
  expect(await pg("select 1 from items where id=$1", [id])).toHaveLength(1);
  await A.kill();
});
