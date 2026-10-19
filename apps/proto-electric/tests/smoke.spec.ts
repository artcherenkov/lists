import { test, expect } from "@playwright/test";

import { newDevice, resetDb, items, until, db, outbox, closeAll } from "./helpers.ts";

test.afterEach(closeAll);

test("smoke: write online, appears in postgres", async ({}, info) => {
  await resetDb();
  const d = await newDevice(info.project.name, "a");
  const id = await d.page.evaluate(() =>
    (window as any).app.addItem({ title: "Dune", kind: "movie" }),
  );
  await until(
    async () => (await db.query("SELECT * FROM items WHERE id=$1", [id])).rows.length,
    (n) => n === 1,
  );
  const list = await until(
    () => items(d),
    (l) => l.length === 1,
  );
  console.log(JSON.stringify(await outbox(d)));
  console.log(JSON.stringify(await d.page.evaluate(() => (window as any).app.metrics)));
  await d.context.close();
});
