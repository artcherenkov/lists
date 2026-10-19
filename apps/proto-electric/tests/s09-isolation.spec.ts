import { test, expect } from "@playwright/test";

import {
  newDevice,
  resetDb,
  items,
  outbox,
  until,
  db,
  closeDevice,
  API,
  closeAll,
} from "./helpers.ts";

test.afterEach(closeAll);

const token = async (sub: string) =>
  (await (await fetch(`${API}/dev/token?sub=${sub}`)).json()).token as string;
const post = (tok: string | null, body: any) =>
  fetch(`${API}/api/mutate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(tok ? { authorization: `Bearer ${tok}` } : {}),
    },
    body: JSON.stringify({ dataVersion: 1, idempotencyKey: crypto.randomUUID(), ...body }),
  });

test("s9: a person reads and writes only their own data", async ({}, info) => {
  await resetDb();
  const aliceItem = crypto.randomUUID();
  await db.query(
    `INSERT INTO items (id,user_id,kind,title,added_at,updated_at) VALUES ($1,'alice','series','Alice show',now(),now())`,
    [aliceItem],
  );
  await db.query(
    `INSERT INTO marks (id,user_id,item_id,season,state,updated_at) VALUES ($1,'alice',$2,1,'watched',now())`,
    [`${aliceItem}:1`, aliceItem],
  );
  await db.query(`UPDATE items SET tmdb_id = 7 WHERE id = $1`, [aliceItem]);
  await db.query(`INSERT INTO shows (id,title) VALUES (7,'Catalog 7'),(8,'Catalog 8')`);
  const bob = await token("bob");
  const out: string[] = [];

  // reads through the proxy: client-supplied where / table / params are ignored
  for (const name of ["items", "marks", "shows"]) {
    const r = await fetch(`${API}/shape/${name}?offset=-1&where=true&table=items&params[1]=alice`, {
      headers: { authorization: `Bearer ${bob}`, "x-data-version": "1" },
    });
    const body = await r.json();
    out.push(
      `bob reads ${name}: ${r.status}, rows=${Array.isArray(body) ? body.filter((m: any) => m.value).length : "?"}`,
    );
    expect(r.status).toBe(200);
    expect(body.filter((m: any) => m.value).length).toBe(0);
  }
  // no token, forged token
  expect(
    (await fetch(`${API}/shape/items?offset=-1`, { headers: { "x-data-version": "1" } })).status,
  ).toBe(401);
  expect(
    (
      await fetch(`${API}/shape/items?offset=-1`, {
        headers: { authorization: "Bearer abc.def.ghi", "x-data-version": "1" },
      })
    ).status,
  ).toBe(401);
  expect(
    (
      await fetch(`${API}/row/items/${aliceItem}`, {
        headers: { authorization: `Bearer ${bob}`, "x-data-version": "1" },
      })
    ).status,
  ).toBe(404);

  // writes
  const base = { accountId: "bob" };
  const upd = await post(bob, {
    ...base,
    mutations: [{ table: "items", type: "update", key: aliceItem, changes: { note: "hacked" } }],
  });
  out.push(`bob updates alice item: ${upd.status}`);
  expect(upd.status).toBe(422);
  const ins = await post(bob, {
    ...base,
    mutations: [
      {
        table: "items",
        type: "insert",
        key: aliceItem,
        modified: {
          kind: "movie",
          title: "x",
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: "alice",
        },
      },
    ],
  });
  out.push(`bob inserts with alice's id: ${ins.status}`);
  expect(ins.status).toBe(403);
  const claim = await post(bob, { accountId: "alice", mutations: [] });
  out.push(`bob claims accountId alice: ${claim.status}`);
  expect(claim.status).toBe(403);
  const mk = await post(bob, {
    ...base,
    mutations: [
      {
        table: "marks",
        type: "insert",
        key: `${aliceItem}:2`,
        modified: {
          item_id: aliceItem,
          season: 2,
          state: "watched",
          updated_at: new Date().toISOString(),
        },
      },
    ],
  });
  out.push(`bob marks alice item: ${mk.status}`);
  expect(mk.status).toBe(422);
  const del = await post(bob, {
    ...base,
    mutations: [{ table: "marks", type: "delete", key: `${aliceItem}:1` }],
  });
  out.push(`bob deletes alice mark: ${del.status}`);
  expect((await db.query("SELECT 1 FROM marks WHERE id=$1", [`${aliceItem}:1`])).rowCount).toBe(1);
  expect((await post(null, { ...base, mutations: [] })).status).toBe(401);
  // the owner is set by the server from the token
  const mine = crypto.randomUUID();
  const ok = await post(bob, {
    ...base,
    mutations: [
      {
        table: "items",
        type: "insert",
        key: mine,
        modified: {
          kind: "movie",
          title: "Bob own",
          added_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: "alice",
        },
      },
    ],
  });
  expect(ok.status).toBe(200);
  expect((await db.query("SELECT user_id FROM items WHERE id=$1", [mine])).rows[0].user_id).toBe(
    "bob",
  );
  expect(
    (await db.query("SELECT note FROM items WHERE id=$1", [aliceItem])).rows[0].note,
  ).toBeNull();
  console.log(out.join("\n"));

  // in the browser: bob's device sees only bob's rows
  const d = await newDevice(info.project.name, "bob", "bob");
  await until(
    () => items(d),
    (l) => l.length === 1,
  );
  expect((await items(d))[0].title).toBe("Bob own");
  expect((await d.page.evaluate(() => (window as any).app.shows())).length).toBe(0);
  await closeDevice(d);
});

test("s9b: Electric port is open without the proxy (dev setup)", async () => {
  const r = await fetch("http://127.0.0.1:13000/v1/shape?table=items&offset=-1");
  console.log("direct Electric (ELECTRIC_INSECURE=true):", r.status);
});
