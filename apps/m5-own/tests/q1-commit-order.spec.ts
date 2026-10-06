import { expect, test } from "@playwright/test";
import pg from "pg";

import { api, edit, sleep, sql, token, uid } from "./helpers.ts";

const connect = async () => {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: 15440,
    user: "postgres",
    password: "postgres",
    database: "app",
  });
  await client.connect();
  return client;
};

test("выдача по номеру идёт в порядке коммитов: транзакция с большим номером не опережает меньшую", async () => {
  const user = uid();
  const [t1, t2] = [await connect(), await connect()];
  const insert = (c: pg.Client, id: string) =>
    c.query("INSERT INTO items (id, user_id, kind, title, dv) VALUES ($1, $2, 'film', $1, 1)", [
      id,
      user,
    ]);
  const [first, second] = [uid("first"), uid("second")];
  try {
    await t1.query("BEGIN");
    await insert(t1, first); // номер выдан, транзакция ещё не закоммичена
    await t2.query("BEGIN");
    const blocked = insert(t2, second).then(() => "вставила");
    expect(await Promise.race([blocked, sleep(500).then(() => "ждёт")])).toBe("ждёт");

    const t = await token(user);
    expect((await api("/api/pull?cp=0", { token: t, dv: 1 })).body.items).toEqual([]);
    await t1.query("COMMIT");
    await blocked;
    await t2.query("COMMIT");

    const page = (await api("/api/pull?cp=0", { token: t, dv: 1 })).body;
    expect(page.items.map((r: any) => r.id)).toEqual([first, second]);
    const seqOf = async (id: string) =>
      Number((await sql("SELECT seq FROM items WHERE id = $1", [id]))[0].seq);
    expect(await seqOf(first)).toBeLessThan(await seqOf(second));
  } finally {
    t1.end();
    t2.end();
  }
});

test("читатель с контрольной точкой не теряет изменение при 40 параллельных записях", async () => {
  const user = uid();
  const t = await token(user);
  const ids = Array.from({ length: 40 }, () => uid("i"));
  let writing = true;
  const writers = Promise.all(
    ids.map((id) =>
      api("/api/push", {
        token: t,
        dv: 1,
        json: { edits: [edit(user, uid("k"), "items", id, { kind: "film", title: id })] },
      }),
    ),
  ).finally(() => (writing = false));

  // Читатель идёт по контрольной точке, пока писатели работают, и ещё раз после них.
  const seen = new Set<string>();
  let cp = 0;
  for (let last = false; !last;) {
    last = !writing;
    for (let more = true; more;) {
      const page = (await api(`/api/pull?cp=${cp}&limit=3`, { token: t, dv: 1 })).body;
      page.items.forEach((r: any) => seen.add(r.id));
      cp = page.cp;
      more = page.more;
    }
  }
  await writers;
  expect([...seen].sort()).toEqual([...ids].sort());
});
