import { test, expect } from "@playwright/test";
import { generateKeyPair, SignJWT } from "jose";
import { admin, API, browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

const call = async (token: string | null, path: string, body?: unknown) => {
  const r = await fetch(API + path, {
    method: body ? "POST" : "GET",
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "x-data-version": "3" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => null) };
};

test("9. права: только своё, в том числе прямыми запросами; владельца ставит сервер", async ({}, info) => {
  const u1 = uid("a");
  const u2 = uid("b");
  const A = await Device.create(browserOf(info), "A", { user: u1 }).start();
  const B = await Device.create(browserOf(info), "B", { user: u2 }).start();
  const mine = await A.p("addItem", { kind: "series", title: "Private" });
  await A.p("setSeason", mine, 1, "watching");
  const theirs = await B.p("addItem", { title: "Other" });
  await queueEmpty(A);
  await queueEmpty(B);
  await until(() => pg("select 1 from seasons where item_id=$1", [mine]), (r) => r.length === 1);
  expect(await pg("select user_id from items where id=$1", [mine])).toEqual([{ user_id: u1 }]);
  expect(await B.item(mine)).toBeNull();
  expect(await B.p("seasons")).toEqual([]);

  const t2 = (await admin("/dev/token", { user: u2 })).token as string;
  // чужую запись не прочитать
  expect((await call(t2, `/doc/items/${mine}`)).json).toEqual({ id: mine, _deleted: true });
  const pull = await call(t2, "/pull/items?seq=0&limit=100");
  expect(pull.json.documents.map((d: any) => d.id)).toEqual([theirs]);
  // и не изменить: ни правкой, ни от своего имени
  const edit = await call(t2, "/push/items", { rows: [{ assumedMasterState: { id: mine, title: "Private" }, newDocumentState: { id: mine, kind: "movie", title: "Hacked", status: "want", added_at: "a", updated_at: "b", dv: 3 } }] });
  expect(edit.json.rejected).toEqual([{ id: mine, reason: "not yours" }]);
  expect(JSON.stringify(edit.json)).not.toContain("Private"); // в ответе только то, что прислал сам
  const owner = await call(t2, "/push/items", { rows: [{ newDocumentState: { id: uid("o"), user_id: u1, kind: "movie", title: "Spoof", status: "want", added_at: "a", updated_at: "a", dv: 3 } }] });
  expect(owner.json.rejected[0].reason).toBe("unknown field user_id");
  const mark = await call(t2, "/push/seasons", { rows: [{ newDocumentState: { id: `${mine}:2`, item_id: mine, season: 2, state: "watched", updated_at: "a" } }] });
  expect(mark.json.later.length + mark.json.rejected.length).toBe(1); // чужой записи для этого человека нет
  expect(await pg("select title from items where id=$1", [mine])).toEqual([{ title: "Private" }]);
  expect(await pg("select 1 from seasons where id=$1", [`${mine}:2`])).toHaveLength(0);
  // без токена, с чужой подписью
  expect((await call(null, "/pull/items?seq=0")).status).toBe(401);
  const { privateKey } = await generateKeyPair("EdDSA");
  const forged = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA" }).setSubject(u1).setIssuer("http://127.0.0.1:13200").setAudience("http://127.0.0.1:13200").setExpirationTime("5m").sign(privateKey);
  expect((await call(forged, "/pull/items?seq=0")).status).toBe(401);
  const none = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA" }).setSubject(u1).setIssuer("http://127.0.0.1:13200").setAudience("http://127.0.0.1:13200").setExpirationTime("-1m").sign(privateKey);
  expect((await call(none, "/pull/items?seq=0")).status).toBe(401);
  await A.kill();
  await B.kill();
});
