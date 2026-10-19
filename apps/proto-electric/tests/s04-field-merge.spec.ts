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
  blockMutations,
  unblockMutations,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

const form = (r: any) => ({
  kind: r.kind,
  title: r.title,
  status: r.status,
  rating: r.rating,
  watched_month: r.watched_month,
  note: r.note,
  year: r.year,
  tmdb_id: r.tmdb_id,
  poster: r.poster,
});

test("s4a: whole-form update sends only changed fields; unknown server field survives", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie", rating: 6, note: "n" }),
  );
  await until(
    () => outbox(d),
    (o) => o.length === 0,
  );
  await db.query(`UPDATE items SET future_flag = 'from-newer-version' WHERE id = $1`, [id]);
  await until(
    () => items(d),
    (l) => l[0]?.future_flag === "from-newer-version",
  );
  await blockMutations(d);
  const row = (await items(d)).find((r: any) => r.id === id);
  await d.page.evaluate(
    ([id, f]) => (window as any).app.editWholeForm(id, f, { status: "watched" }),
    [id, form(row)] as const,
  );
  const ob = await until(
    () => outbox(d),
    (o) => o.length === 1,
  );
  const keys = Object.keys(ob[0].muts[0].changes).sort();
  console.log("whole-form update changes keys:", keys.join(","));
  expect(keys).toEqual(["status", "updated_at"]);
  await unblockMutations(d);
  await until(
    async () =>
      (await db.query("SELECT status, future_flag, rating, note FROM items WHERE id=$1", [id]))
        .rows[0],
    (r) => r.status === "watched",
  );
  const r = (
    await db.query("SELECT status, future_flag, rating, note FROM items WHERE id=$1", [id])
  ).rows[0];
  expect(r).toEqual({ status: "watched", future_flag: "from-newer-version", rating: 6, note: "n" });
  await closeDevice(d);
});

test("s4b: two offline devices edit different fields of one record, both kept; same field, the last to arrive wins", async ({}, info) => {
  await resetDb();
  const a = await newDevice(info.project.name, "a");
  const b = await newDevice(info.project.name, "b");
  const id = await a.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie" }),
  );
  await until(
    () => items(b),
    (l) => l.some((r: any) => r.id === id),
  );
  await goOffline(a);
  await goOffline(b);
  await a.page.evaluate((id) => (window as any).app.edit(id, { rating: 3, status: "watched" }), id);
  await new Promise((r) => setTimeout(r, 50));
  await b.page.evaluate((id) => (window as any).app.edit(id, { note: "b note", rating: 9 }), id); // B is later in time and shares "rating"
  await until(
    () => outbox(a),
    (o) => o.length === 1,
  );
  await until(
    () => outbox(b),
    (o) => o.length === 1,
  );
  // A reaches the server last, although its edit of rating is earlier on the clock
  await goOnline(b);
  await until(
    async () => (await db.query("SELECT rating, note FROM items WHERE id=$1", [id])).rows[0],
    (r) => r.rating === 9 && r.note === "b note",
  );
  await goOnline(a);
  const final = await until(
    async () =>
      (await db.query("SELECT rating, note, status FROM items WHERE id=$1", [id])).rows[0],
    (r) => r.rating === 3,
  );
  expect(final).toEqual({ rating: 3, note: "b note", status: "watched" });
  for (const d of [a, b]) {
    const r = await until(
      async () => (await items(d)).find((r: any) => r.id === id),
      (r) => r.rating === 3 && r.note === "b note" && r.status === "watched",
    );
    expect(r.$hasPendingWrites).toBe(false);
  }
  await closeDevice(a);
  await closeDevice(b);
});
