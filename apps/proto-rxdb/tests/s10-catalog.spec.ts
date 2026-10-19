import { test, expect } from "@playwright/test";

import { browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("10. каталог приезжает и уходит вместе с записью человека, правка каталога доходит", async ({}, info) => {
  const user = uid();
  const a = uid("tmdb");
  const other = uid("tmdb");
  await pg(
    "insert into shows (id, title, seasons_json, updated_at) values ($1,'Catalog show','[1,2]','2026-01-01'), ($2,'Not mine','[1]','2026-01-01')",
    [a, other],
  );
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const shows = async (d: Device) => (await d.p("shows")).map((s: any) => s.id).sort();
  expect(await shows(B)).toEqual([]);

  const id = await A.p("addItem", { kind: "series", title: "Catalog show", tmdb_id: a });
  await queueEmpty(A);
  await until(
    () => shows(B),
    (v) => v.length === 1 && v[0] === a,
    15_000,
    "show arrived with item",
  );
  expect(await shows(A)).toEqual([a]);

  await pg("update shows set seasons_json = '[1,2,3]' where id = $1", [a]);
  await until(
    () => B.p("shows"),
    (v) => v[0]?.seasons_json === "[1,2,3]",
    15_000,
    "catalog edit",
  );
  await until(
    () => A.p("shows"),
    (v) => v[0]?.seasons_json === "[1,2,3]",
    15_000,
    "catalog edit on A",
  );

  await A.p("softDelete", id);
  await until(
    () => shows(B),
    (v) => v.length === 0,
    15_000,
    "show left with item",
  );
  await until(
    () => shows(A),
    (v) => v.length === 0,
    15_000,
    "show left on A",
  );
  expect(await pg("select 1 from shows where id=$1", [a])).toHaveLength(1); // на сервере сериал остаётся

  await A.p("addItem", { kind: "series", title: "Catalog show", tmdb_id: a });
  await until(
    () => shows(B),
    (v) => v.length === 1,
    15_000,
    "show returned with new item",
  );
  await A.kill();
  await B.kill();
});
