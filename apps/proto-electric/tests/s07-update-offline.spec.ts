import { test, expect } from "@playwright/test";

import {
  newDevice,
  resetDb,
  items,
  outbox,
  until,
  db,
  goOffline,
  goOnline,
  closeDevice,
  restartDevice,
  launch,
  setBuild,
  setServer,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

test("s7: update without network to a new data version", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie", rating: 6, note: "n" }),
  );
  const id2 = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Heat", kind: "movie", rating: 9 }),
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await until(
    async () => (await db.query("SELECT 1 FROM items")).rowCount,
    (n) => n === 2,
  );
  await new Promise((r) => setTimeout(r, 1500)); // the copy is written to disk a moment after the ack
  await goOffline(d);
  await d.page.evaluate((id) => (window as any).app.edit(id, { rating: 8 }), id); // queued in v1 format
  await until(
    () => outbox(d),
    (o) => o.length === 1,
  );
  await closeDevice(d);

  // the "deploy": new client build, server moves to v2 and translates its rows
  await setServer(2, 1);
  await db.query("UPDATE items SET stars = ceil(rating/2.0), rating = NULL, fmt = 2");
  const keysBefore = (await db.query("SELECT count(*)::int n FROM applied_keys")).rows[0].n;
  await setBuild("v2");
  await restartDevice(d); // still offline: the block is kept on the server side by device tag

  const t0 = Date.now();
  const list = await until(
    () => items(d),
    (l) => l.length === 2,
    5000,
  );
  console.log("rows readable after reopen, ms:", Date.now() - t0);
  console.log(
    "after update, offline:",
    JSON.stringify(
      list.map((r: any) => ({ t: r.title, stars: r.stars, rating: r.rating, fmt: r.fmt })),
    ),
  );
  expect(list.length).toBe(2); // not empty
  expect(list.find((r: any) => r.id === id).stars).toBe(4); // visible: copy translated + queued edit on top
  expect((await d.page.evaluate((id) => (window as any).app.synced("items", id), id)).stars).toBe(
    3,
  ); // the copy itself
  const ob = await outbox(d);
  expect(ob.length).toBe(1); // translation of the copy is not an edit
  console.log("queued after translate:", JSON.stringify(ob[0].muts), JSON.stringify(ob[0].meta));
  console.log(
    "translated:",
    JSON.stringify(await d.page.evaluate(() => (window as any).app.state.translated)),
  );
  expect(Object.keys(ob[0].muts[0].changes).sort()).toEqual(["stars", "updated_at"]);
  expect((await db.query("SELECT count(*)::int n FROM applied_keys")).rows[0].n).toBe(keysBefore);

  await goOnline(d);
  await until(
    () => outbox(d),
    (o) => o.length === 0,
    15000,
  ).catch(async (e) => {
    console.log(
      "DIAG",
      JSON.stringify(await d.page.evaluate(() => (window as any).app.state)),
      (await db.query("SELECT stars,rating,fmt FROM items")).rows,
      (await db.query("SELECT count(*) FROM applied_keys")).rows,
    );
    throw e;
  });
  const r = (await db.query("SELECT stars, rating, fmt, note FROM items WHERE id=$1", [id]))
    .rows[0];
  expect(r).toEqual({ stars: 4, rating: null, fmt: 2, note: "n" });
  expect((await db.query("SELECT count(*)::int n FROM applied_keys")).rows[0].n).toBe(
    keysBefore + 1,
  );
  const l2 = await until(
    () => items(d),
    (l) => l.find((x: any) => x.id === id)?.stars === 4,
  );
  expect(l2.length).toBe(2);
  expect(l2.find((x: any) => x.id === id2).stars).toBe(5);
  await closeDevice(d);
});

// Control: what the library does by itself when the app only bumps persistence schemaVersion (no our SQL translation).
test("s7x: control - schemaVersion bump without our translation empties the list offline", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie", rating: 6 }),
  );
  await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Heat", kind: "movie", rating: 9 }),
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await new Promise((r) => setTimeout(r, 1500));
  await goOffline(d);
  await d.page.evaluate(
    (id) => (window as any).app.edit(id, { rating: 8 }),
    (await items(d))[0].id,
  );
  await closeDevice(d);
  await launch(d, "&schema=2");
  await new Promise((r) => setTimeout(r, 3000));
  const list = await items(d);
  const ob = await outbox(d);
  console.log("schemaVersion bump offline: rows visible =", list.length, ", outbox =", ob.length);
});
