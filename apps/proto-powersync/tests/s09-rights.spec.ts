import { test, expect } from "@playwright/test";
import { generateKeyPair, SignJWT } from "jose";
import { admin, API, Device, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";

const PS = "http://127.0.0.1:18080";
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";
const tokenFor = async (user: string, dv = 1) => (await admin("/token", { user, dv })).token as string;
const upload = (token: string | null, ops: any[], dv = 1) =>
  fetch(API + "/upload", { method: "POST", headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "x-data-version": String(dv) }, body: JSON.stringify({ ops }) });

async function streamIds(token: string, subscriptions: any[] = [], extra: any = {}) {
  const r = await fetch(PS + "/sync/stream", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/x-ndjson" },
    body: JSON.stringify({ buckets: [], include_checksum: true, raw_data: true, client_id: "t", streams: { include_defaults: true, subscriptions }, ...extra }),
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) return { status: r.status, text: await r.text(), ids: [] as string[] };
  const text = await r.text().catch(() => "");
  return { status: r.status, text, ids: [...text.matchAll(/"object_id":"([^"]+)"/g)].map((m) => m[1]) };
}
async function streamTexts(token: string, subscriptions: any[] = [], extra: any = {}) {
  const ctl = new AbortController();
  const r = await fetch(PS + "/sync/stream", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", accept: "application/x-ndjson" },
    body: JSON.stringify({ buckets: [], include_checksum: true, raw_data: true, client_id: "t", streams: { include_defaults: true, subscriptions }, ...extra }),
    signal: ctl.signal,
  });
  if (!r.ok) return { status: r.status, body: await r.text() };
  const reader = r.body!.getReader();
  let acc = "";
  const dec = new TextDecoder();
  const t0 = Date.now();
  while (Date.now() - t0 < 5000) {
    const { value, done } = await reader.read();
    if (done) break;
    acc += dec.decode(value);
    if (acc.includes("checkpoint_complete")) break;
  }
  ctl.abort();
  return { status: 200, body: acc };
}

test("9a. устройство Боба не получает чужого, в том числе по прямому запросу к сервису", async ({}, info) => {
  const alice = uid("alice"), bob = uid("bob");
  const a1 = uid("a1");
  await pg("insert into items(id,user_id,kind,title) values($1,$2,'film','alice-secret')", [a1, alice]);
  await pg("insert into items(id,user_id,kind,title) values($1,$2,'film','bob-own')", [uid("b1"), bob]);
  const B = Device.create(browserOf(info), "B", { user: bob });
  await B.start();
  await until(() => B.itemIds(), (ids) => ids.length === 1, 15_000, "bob gets own");
  const raw = await B.p("sql", "select id, json_extract(data,'$.title') t from ps_data__items");
  expect(raw.map((r: any) => r.t)).toEqual(["bob-own"]);
  const oplog = await B.p("sql", "select count(*) n from ps_oplog where key = ?", [a1]);
  console.log(`[${info.project.name}] строк Алисы в локальной ps_data__items: 0, в ps_oplog: ${oplog[0].n}`);
  await B.kill();
  if (info.project.name !== "chromium") return;

  const tb = await tokenFor(bob);
  const own = await streamTexts(tb);
  expect(own.body).toContain("bob-own");
  expect(own.body).not.toContain("alice-secret");
  // подписка на поток с id чужой записи и подмена параметров соединения
  const hack = await streamTexts(tb, [{ stream: "item_one", parameters: { id: a1 }, override_priority: null }], { parameters: { user_id: alice } });
  console.log("прямой запрос Боба к /sync/stream с id записи Алисы:", hack.status, hack.body.includes("alice-secret") ? "УТЕЧКА" : "чужого нет");
  expect(hack.status).toBe(200);
  expect(hack.body).toContain("item_one");
  expect(hack.body).not.toContain("alice-secret");
  // без токена и с токеном чужого ключа
  expect((await fetch(PS + "/sync/stream", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status).toBe(401);
  const other = await generateKeyPair("EdDSA");
  const forged = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA", kid: "proto-1" }).setSubject(alice).setAudience("powersync-proto").setIssuedAt().setExpirationTime("5m").sign(other.privateKey);
  const f = await fetch(PS + "/sync/stream", { method: "POST", headers: { authorization: `Bearer ${forged}`, "content-type": "application/json" }, body: JSON.stringify({ buckets: [], streams: { include_defaults: true, subscriptions: [] } }) });
  console.log("токен, подписанный чужим ключом (sub = Алиса), к сервису:", f.status);
  expect(f.status).toBe(401);
  const wrongAud = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA", kid: "proto-1" }).setSubject(alice).setAudience("someone-else").setIssuedAt().setExpirationTime("5m").sign(other.privateKey);
  expect((await fetch(PS + "/sync/stream", { method: "POST", headers: { authorization: `Bearer ${wrongAud}`, "content-type": "application/json" }, body: "{}" })).status).toBe(401);
});

test("9b. обработчик записи: чужое не читается и не пишется, владельца ставит сервер", async ({}, info) => {
  test.skip(info.project.name !== "chromium", "серверная проверка, браузер не нужен");
  const alice = uid("alice"), bob = uid("bob");
  const a1 = uid("a1");
  await pg("insert into items(id,user_id,kind,title,rating) values($1,$2,'film','alice-secret',5)", [a1, alice]);
  await pg("insert into items(id,user_id,kind,title) values($1,$2,'series','alice-series')", [uid("as"), alice]);
  const tb = await tokenFor(bob);
  const res = async (ops: any[], token: string | null = tb) => {
    const r = await upload(token, ops);
    return r.status === 200 ? (await r.json()).results.map((x: any) => `${x.status}${x.error ? ": " + x.error : ""}`) : r.status;
  };
  const out = {
    ownerInData: await res([{ op: "PUT", table: "items", id: uid("n"), data: { user_id: alice, kind: "film", title: "x" } }]),
    takeOverId: await res([{ op: "PUT", table: "items", id: a1, data: { kind: "film", title: "stolen", rating: 1 } }]),
    patchForeign: await res([{ op: "PATCH", table: "items", id: a1, data: { rating: 1 } }]),
    deleteForeign: await res([{ op: "DELETE", table: "items", id: a1 }]),
    seasonOnForeign: await res([{ op: "PUT", table: "seasons", id: `${a1}:1`, data: { item_id: a1, season: 1, state: "watched" } }]),
    noToken: await res([], null),
    garbage: await res([], "abc.def.ghi"),
  };
  console.log("обработчик записи, Боб против записей Алисы:", JSON.stringify(out));
  expect(out.ownerInData).toEqual(["rejected: unknown field user_id"]);
  expect(out.takeOverId).toEqual(["rejected: id belongs to another account"]);
  expect(out.patchForeign).toEqual(["rejected: not found or not yours"]);
  expect(out.deleteForeign).toEqual(["rejected: not found or not yours"]);
  expect(out.seasonOnForeign).toEqual(["rejected: item not found"]);
  expect(out.noToken).toBe(401);
  expect(out.garbage).toBe(401);
  expect((await pg("select user_id,title,rating from items where id=$1", [a1]))[0]).toEqual({ user_id: alice, title: "alice-secret", rating: 5 });
  // владельца ставит сервер
  const mine = uid("m");
  expect(await res([{ op: "PUT", table: "items", id: mine, data: { kind: "film", title: "mine" } }])).toEqual(["ok"]);
  expect((await pg("select user_id from items where id=$1", [mine]))[0].user_id).toBe(bob);
  // токен с истёкшим сроком
  await admin("/admin/ttl", { seconds: 1 });
  const short = await tokenFor(bob);
  await sleep(2500);
  await admin("/admin/ttl", { seconds: 300 });
  expect(await res([], short)).toBe(401);
});
