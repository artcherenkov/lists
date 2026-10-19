import { test, expect } from "@playwright/test";

import {
  newDevice,
  resetDb,
  items,
  outbox,
  until,
  db,
  closeDevice,
  restartDevice,
  launch,
  goOffline,
  goOnline,
  setBuild,
  setServer,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

test("s8a: a client below the minimum version neither reads nor writes", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie" }),
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await goOffline(d);
  await d.page.evaluate(
    (id) => (window as any).app.edit(id, { note: "queued before the bump" }),
    id,
  );
  await until(
    () => outbox(d),
    (o) => o.length === 1,
  );
  await closeDevice(d);
  await setServer(2, 2); // the minimum goes up while this client is closed
  await db.query(
    `INSERT INTO items (id,user_id,kind,title,added_at,updated_at) VALUES (gen_random_uuid(),'alice','movie','Server-side new',now(),now())`,
  );
  await launch(d);
  await goOnline(d);
  await new Promise((r) => setTimeout(r, 5000));
  const st = await d.page.evaluate(() => ({ ...(window as any).app.state, rejections: undefined }));
  console.log("below-min state:", JSON.stringify(st));
  expect(st.updateRequired).toBe(true);
  expect((await items(d)).map((r: any) => r.title)).not.toContain("Server-side new"); // did not read
  const err = await d.page.evaluate(() => {
    try {
      (window as any).app.addItem({ title: "Written below min", kind: "movie" });
      return "accepted";
    } catch (e: any) {
      return String(e.message).slice(0, 80);
    }
  });
  console.log("new write on a stopped collection:", err);
  expect((await db.query(`SELECT 1 FROM items WHERE title='Written below min'`)).rowCount).toBe(0);
  expect((await db.query(`SELECT note FROM items WHERE id=$1`, [id])).rows[0].note).toBeNull(); // the queued edit did not go
  expect((await outbox(d)).length).toBeGreaterThanOrEqual(1);
  await closeDevice(d);
});

test("s8b: a client newer than the server waits and goes on when the server is updated", async ({}, info) => {
  await resetDb();
  await setBuild("v2");
  await setServer(1, 1);
  const d = await newDevice(info.project.name, "a");
  await db.query(
    `INSERT INTO items (id,user_id,kind,title,added_at,updated_at) VALUES (gen_random_uuid(),'alice','movie','Server item',now(),now())`,
  );
  await d.page.evaluate(() => (window as any).app.addItem({ title: "Mine", kind: "movie" }));
  await new Promise((r) => setTimeout(r, 5000));
  console.log(
    "newer-than-server errors:",
    JSON.stringify(await d.page.evaluate(() => (window as any).app.state.errors.slice(0, 3))),
  );
  expect((await items(d)).map((r: any) => r.title)).not.toContain("Server item");
  expect((await db.query(`SELECT 1 FROM items WHERE title='Mine'`)).rowCount).toBe(0);
  expect((await outbox(d)).length).toBe(1);
  expect(await d.page.evaluate(() => (window as any).app.state.serverOlder)).toBe(true);
  await setServer(2, 1);
  await until(
    async () => (await db.query(`SELECT 1 FROM items WHERE title='Mine'`)).rowCount,
    (n) => n === 1,
    30000,
  );
  await until(
    () => items(d),
    (l) => l.some((r: any) => r.title === "Server item"),
    30000,
  );
  await closeDevice(d);
});
