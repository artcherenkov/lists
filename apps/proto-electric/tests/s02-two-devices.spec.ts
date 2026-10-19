import { test, expect } from "@playwright/test";

import { newDevice, resetDb, items, marks, until, closeDevice, closeAll } from "./helpers.ts";

test.afterEach(closeAll);

// Scenario 2: an edit on one device reaches the other device of the same account without reload, both directions.
test("s2: edits travel both ways between two devices", async ({}, info) => {
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

  await b.page.evaluate((id) => (window as any).app.edit(id, { rating: 9, status: "watched" }), id);
  await until(
    () => items(a),
    (l) => l.find((r: any) => r.id === id)?.rating === 9,
  );
  expect((await items(a)).find((r: any) => r.id === id).status).toBe("watched");

  await a.page.evaluate((id) => (window as any).app.edit(id, { note: "from A" }), id);
  await until(
    () => items(b),
    (l) => l.find((r: any) => r.id === id)?.note === "from A",
  );

  const sid = await a.page.evaluate(() =>
    (window as any).app.addItem({ title: "Severance", kind: "series", tmdb_id: 95396 }),
  );
  await until(
    () => items(b),
    (l) => l.some((r: any) => r.id === sid),
  );
  await a.page.evaluate((sid) => (window as any).app.setMark(sid, 1, "watched"), sid);
  await until(
    () => marks(b),
    (l) => l.some((m: any) => m.id === `${sid}:1` && m.state === "watched"),
  );
  await b.page.evaluate((sid) => (window as any).app.setMark(sid, 1, "watching"), sid);
  await until(
    () => marks(a),
    (l) => l.some((m: any) => m.id === `${sid}:1` && m.state === "watching"),
  );
  await closeDevice(a);
  await closeDevice(b);
});
