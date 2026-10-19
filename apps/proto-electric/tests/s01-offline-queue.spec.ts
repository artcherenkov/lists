import { test, expect } from "@playwright/test";

import {
  newDevice,
  resetDb,
  items,
  until,
  db,
  outbox,
  goOffline,
  goOnline,
  restartDevice,
  closeDevice,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

// Scenario 1: a write without network survives reload and closing the app; after going online the queue is sent.
test("s1: offline write survives reload and app close, then is sent", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const seed = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Seed", kind: "movie" }),
  );
  await until(
    async () => (await db.query("SELECT 1 FROM items WHERE id=$1", [seed])).rowCount,
    (n) => n === 1,
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );

  await goOffline(d);
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Offline Movie", kind: "movie" }),
  );
  await d.page.evaluate((id) => (window as any).app.edit(id, { rating: 7, status: "watched" }), id);
  await d.page.evaluate((s) => (window as any).app.edit(s, { note: "seed edited offline" }), seed);
  await until(
    () => outbox(d),
    (o) => o.length === 3,
  );
  expect((await db.query("SELECT 1 FROM items WHERE id=$1", [id])).rowCount).toBe(0);

  // reload the page
  await d.page.reload();
  await d.page.waitForFunction(() => (window as any).appReady);
  expect((await outbox(d)).length).toBe(3);
  let list = await until(
    () => items(d),
    (l) =>
      l.length === 2 &&
      l.find((r: any) => r.id === id)?.rating === 7 &&
      l.find((r: any) => r.id === seed)?.note === "seed edited offline",
  );
  expect(list.find((r: any) => r.id === id)?.rating).toBe(7);
  expect(list.find((r: any) => r.id === seed)?.note).toBe("seed edited offline");

  // close the whole app and open it again (still without network)
  await restartDevice(d);
  expect((await outbox(d)).length).toBe(3);
  list = await until(
    () => items(d),
    (l) => l.length === 2 && l.find((r: any) => r.id === id)?.rating === 7,
  );
  expect(list.map((r: any) => r.title).sort()).toEqual(["Offline Movie", "Seed"]);
  expect(list.find((r: any) => r.id === id)?.rating).toBe(7);
  expect((await db.query("SELECT 1 FROM items WHERE id=$1", [id])).rowCount).toBe(0);

  // network back: queue is sent in order
  await goOnline(d);
  await until(
    async () => (await db.query("SELECT rating, status FROM items WHERE id=$1", [id])).rows[0],
    (r) => r?.rating === 7 && r.status === "watched",
  );
  await until(
    async () => (await db.query("SELECT note FROM items WHERE id=$1", [seed])).rows[0],
    (r) => r.note === "seed edited offline",
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await until(
    () => items(d),
    (l) => l.every((r: any) => !r.$hasPendingWrites),
  );
  await closeDevice(d);
});
