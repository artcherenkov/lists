import { test, expect } from "@playwright/test";

import {
  newDevice,
  resetDb,
  items,
  outbox,
  until,
  db,
  blockMutations,
  unblockMutations,
  rotateShapes,
  closeDevice,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

// Scenario 3: a new load from the server (whole shape, and one record) does not erase the queue.
test("s3a: full reload of the shape (shape rotation) keeps the queue and the optimistic state", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const ids: string[] = [];
  for (const t of ["One", "Two", "Three"])
    ids.push(
      await d.page.evaluate((t) => (window as any).app.addItem({ title: t, kind: "movie" }), t),
    );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await blockMutations(d);
  await d.page.evaluate((id) => (window as any).app.edit(id, { rating: 8 }), ids[0]);
  await d.page.evaluate((id) => (window as any).app.edit(id, { note: "queued" }), ids[1]);
  await until(
    () => outbox(d),
    (o) => o.length === 2,
  );
  // server side: change another row, then force a new load of the whole shape
  await db.query(`UPDATE items SET note = 'by server' WHERE id = $1`, [ids[2]]);
  await rotateShapes();
  await until(
    () => items(d),
    (l) => l.find((r: any) => r.id === ids[2])?.note === "by server",
  );
  await new Promise((r) => setTimeout(r, 1500)); // give the refetch time to finish
  const list = await items(d);
  expect(list.length).toBe(3);
  expect((await outbox(d)).length).toBe(2);
  expect(list.find((r: any) => r.id === ids[0]).rating).toBe(8);
  expect(list.find((r: any) => r.id === ids[1]).note).toBe("queued");
  await unblockMutations(d);
  await until(
    async () => (await db.query("SELECT rating FROM items WHERE id=$1", [ids[0]])).rows[0].rating,
    (v) => v === 8,
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await closeDevice(d);
});

test("s3b: one record loaded again through the sync write handle keeps the queue", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "One", kind: "movie" }),
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await blockMutations(d);
  await d.page.evaluate((id) => (window as any).app.edit(id, { rating: 8 }), id);
  await until(
    () => outbox(d),
    (o) => o.length === 1,
  );
  await db.query(`UPDATE items SET rating = 3, note = 'srv' WHERE id = $1`, [id]);
  const synced = () => d.page.evaluate((id) => (window as any).app.synced("items", id), id);
  await until(synced, (r) => r?.note === "srv"); // stream delivered it into the synced layer
  expect((await items(d)).find((r: any) => r.id === id).note).toBeNull(); // overlay shows the whole local snapshot
  await db.query(`UPDATE items SET note = 'srv2' WHERE id = $1`, [id]);
  await d.page.evaluate((id) => (window as any).app.refreshOne("items", id), id);
  expect((await synced()).note).toBe("srv2");
  const row = (await items(d)).find((r: any) => r.id === id);
  expect(row.rating).toBe(8); // optimistic layer on top
  expect((await outbox(d)).length).toBe(1);
  await unblockMutations(d);
  await until(
    async () => (await db.query("SELECT rating, note FROM items WHERE id=$1", [id])).rows[0],
    (r) => r.rating === 8 && r.note === "srv2",
  );
  await closeDevice(d);
});
