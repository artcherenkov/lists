import { test, expect } from "@playwright/test";
import pg from "pg";
import { admin, API, sleep, uid } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);
const cfg = { host: "127.0.0.1", port: 15434, user: "postgres", password: "postgres", database: "app" };

test("q1а. наивный nextval теряет изменение, номер под блокировкой – нет (детерминированно)", async ({}, info) => {
  test.skip(info.project.name === "webkit", "серверная проверка без браузера");
  const a = new pg.Client(cfg);
  const b = new pg.Client(cfg);
  const r = new pg.Client(cfg);
  await Promise.all([a.connect(), b.connect(), r.connect()]);
  await r.query("create temp table if not exists x(i int)").catch(() => {});
  await r.query("drop table if exists naive; drop sequence if exists naive_seq; create sequence naive_seq; create table naive (id text primary key, seq bigint default nextval('naive_seq'))");
  // номер взят первой транзакцией, но она коммитится позже второй
  await a.query("begin");
  await a.query("insert into naive (id) values ('slow')"); // seq 1, не закоммичено
  await b.query("insert into naive (id) values ('fast')"); // seq 2, закоммичено
  const first = (await r.query("select id, seq from naive where seq > 0 order by seq")).rows; // читатель видит fast, запоминает 2
  const cp = Number(first[first.length - 1].seq);
  await a.query("commit");
  const second = (await r.query("select id from naive where seq > $1 order by seq", [cp])).rows;
  expect(first.map((x) => x.id)).toEqual(["fast"]);
  expect(second).toEqual([]); // slow никогда не приедет
  await r.query("drop table naive; drop sequence naive_seq");

  // наша схема: триггер берёт блокировку до nextval, вторая транзакция ждёт первую
  const user = uid();
  const ins = (c: pg.Client, id: string) => c.query("insert into items (id, user_id, kind, title, status, added_at, updated_at, dv) values ($1,$2,'movie','t','want','a','a',3)", [id, user]);
  await a.query("begin");
  await ins(a, `${user}-slow`);
  let done = false;
  const second2 = ins(b, `${user}-fast`).then(() => (done = true));
  await sleep(400);
  expect(done).toBe(false); // ждёт
  await a.query("commit");
  await second2;
  const rows = (await r.query("select id, seq from items where user_id = $1 order by seq", [user])).rows;
  expect(rows.map((x) => x.id)).toEqual([`${user}-slow`, `${user}-fast`]); // номера идут в порядке коммитов
  await Promise.all([a.end(), b.end(), r.end()]);
});

test("q1б. параллельные записи через сервер: читатель по контрольной точке не теряет ничего", async ({}, info) => {
  test.skip(info.project.name === "webkit", "серверная проверка без браузера");
  const user = uid();
  const token = (await admin("/dev/token", { user })).token as string;
  const h = { authorization: `Bearer ${token}`, "x-data-version": "3", "content-type": "application/json" };
  const writers = 8, rounds = 25, per = 4;
  const sent = new Set<string>();
  let running = writers;
  const seen = new Set<string>();
  let cp: any = {};
  const reader = (async () => {
    for (;;) {
      const stop = running === 0;
      const q = new URLSearchParams({ seq: String(cp.seq ?? 0), limit: "50", ...(cp.epoch ? { epoch: cp.epoch } : {}) });
      const res = await (await fetch(`${API}/pull/items?${q}`, { headers: h })).json();
      res.documents.forEach((d: any) => seen.add(d.id));
      cp = res.checkpoint;
      if (stop && res.documents.length === 0) return;
      if (res.documents.length === 0) await sleep(5);
    }
  })();
  await Promise.all(Array.from({ length: writers }, async (_, w) => {
    for (let i = 0; i < rounds; i++) {
      const rows = Array.from({ length: per }, (_, k) => {
        const id = `${user}-w${w}-${i}-${k}`;
        sent.add(id);
        return { newDocumentState: { id, kind: "movie", title: id, status: "want", added_at: "a", updated_at: "a", dv: 3 } };
      });
      const r = await fetch(`${API}/push/items`, { method: "POST", headers: h, body: JSON.stringify({ rows }) });
      expect(r.status).toBe(200);
    }
    running--;
  }));
  await reader;
  expect(sent.size).toBe(writers * rounds * per);
  expect([...sent].filter((id) => !seen.has(id))).toEqual([]);
});
