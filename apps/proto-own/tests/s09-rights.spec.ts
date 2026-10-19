import { expect, test } from "@playwright/test";
import { api, Device, edit, queueEmpty, serverItem, sql, token, uid } from "./helpers.ts";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

test("9. человек читает и пишет только своё, в том числе прямыми запросами; владельца ставит сервер", async ({}, info) => {
  const [alice, bob] = [uid("alice"), uid("bob")];
  const a = Device.create(info.project.name as "chromium", "A", { user: alice });
  await a.start();
  const mine: string = await a.proto("createItem", { kind: "series", title: "Секрет Алисы", tmdb_id: "777" });
  await a.proto("markSeason", mine, 1, "watched");
  await queueEmpty(a);
  expect(await serverItem(mine)).toMatchObject({ user_id: alice });
  await sql("INSERT INTO shows (id, title) VALUES ('777', 'Каталог') ON CONFLICT (id) DO NOTHING");

  const [tAlice, tBob] = [await token(alice), await token(bob)];

  // Чтение: Боб не получает ничего чужого, ни записей, ни отметок, ни каталога.
  const bobPull = (await api("/api/pull?cp=0", { token: tBob, dv: 1 })).body;
  expect([bobPull.items, bobPull.seasons, bobPull.shows]).toEqual([[], [], []]);
  expect((await api(`/api/row?entity=items&id=${mine}`, { token: tBob, dv: 1 })).body.row).toBeNull();
  const alicePull = (await api("/api/pull?cp=0", { token: tAlice, dv: 1 })).body;
  expect(alicePull.items.map((r: any) => r.id)).toEqual([mine]);

  // Без токена и с токеном чужого издателя – 401.
  expect((await api("/api/pull?cp=0", { dv: 1 })).status).toBe(401);
  const stranger = await generateKeyPair("EdDSA");
  const forged = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA", kid: "dev-1" }).setSubject(alice).setAudience("lists").setIssuedAt().setExpirationTime("1h").sign(stranger.privateKey);
  expect((await api("/api/pull?cp=0", { token: forged, dv: 1 })).status).toBe(401);
  expect((await api("/api/push", { token: forged, dv: 1, json: { edits: [] } })).status).toBe(401);

  // Запись: чужой идентификатор отклоняется и ничего не выдаёт и не меняет.
  const push = (user: string, t: string, ...edits: object[]) => api("/api/push", { token: t, dv: 1, json: { edits } });
  const hijack = (await push(bob, tBob, edit(bob, uid("k"), "items", mine, { title: "Взято Бобом" }))).body.results[0];
  expect(hijack).toMatchObject({ status: "rejected", error: "идентификатор принадлежит другому аккаунту", row: null });
  const markHijack = (await push(bob, tBob, edit(bob, uid("k"), "seasons", `${mine}:2`, { state: "watched" }))).body.results[0];
  expect(markHijack).toMatchObject({ status: "rejected", row: null });
  // Правка от имени другого аккаунта и попытка задать владельца.
  const asAlice = (await push(bob, tBob, edit(alice, uid("k"), "items", uid("i"), { kind: "film", title: "T" }))).body.results[0];
  expect(asAlice).toMatchObject({ status: "rejected", error: "правка сделана другим аккаунтом" });
  const owner = (await push(bob, tBob, edit(bob, uid("k"), "items", uid("i"), { kind: "film", title: "T", user_id: alice }))).body.results[0];
  expect(owner).toMatchObject({ status: "rejected", error: "неизвестное поле user_id" });
  expect((await serverItem(mine)).title).toBe("Секрет Алисы");
  expect(await sql("SELECT 1 FROM seasons WHERE id = $1", [`${mine}:2`])).toHaveLength(0);

  // Своё создаётся, владелец – по токену.
  const own = uid("i");
  expect((await push(bob, tBob, edit(bob, uid("k"), "items", own, { kind: "film", title: "Моё" }))).body.results[0].status).toBe("ok");
  expect(await serverItem(own)).toMatchObject({ user_id: bob });
  await a.kill();
});
