import { expect, test } from "@playwright/test";

import {
  admin,
  Device,
  queueEmpty,
  resetVersions,
  serverItem,
  sql,
  uid,
  until,
} from "./helpers.ts";

test.afterEach(resetVersions);

test("7. обновление без сети: копия переводится, перевод не правка, неотправленная правка уходит переведённой и только тронутыми полями", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(info.project.name as "chromium", "A", { user, dv: 1 });
  await a.start();
  const x: string = await a.proto("createItem", { kind: "film", title: "X", rating: 8 });
  const y: string = await a.proto("createItem", { kind: "film", title: "Y", rating: 10 });
  const z: string = await a.proto("createItem", { kind: "film", title: "Z" });
  const u: string = await a.proto("createItem", { kind: "film", title: "Нетронутая", rating: 7 });
  await queueEmpty(a);
  const before = await serverItem(u);

  await a.offline();
  await a.proto("editItem", x, { rating: 6 });
  const n: string = await a.proto("createItem", { kind: "film", title: "Новая", rating: 10 });
  expect(await a.queue()).toHaveLength(2);

  // Приложение обновилось без сети: версия данных 2.
  await a.restart({ dv: 2 });
  const rating = async (id: string) => (await a.item(id))?.rating ?? null;
  expect(await a.eval(() => document.querySelectorAll("#list li").length)).toBe(5);
  expect([
    await rating(u),
    await rating(y),
    await rating(x),
    await rating(z),
    await rating(n),
  ]).toEqual([4, 5, 3, null, 5]);

  const queue = await a.queue();
  expect(queue.map((e) => [e.id, e.v, e.fields.rating])).toEqual([
    [x, 2, 3],
    [n, 2, 5],
  ]);
  expect(Object.keys(queue[0].fields).sort()).toEqual(["rating", "updated_at"]);

  await admin("/admin/deploy", { to: 2 });
  await a.online();
  await queueEmpty(a);

  const sent = await sql("SELECT count(*)::int AS n FROM applied_edits WHERE user_id = $1", [user]);
  expect(sent[0].n).toBe(4 + 2); // создания четырёх записей и две правки: перевод ничего не добавил
  const after = await serverItem(u);
  expect(after).toMatchObject({ rating: 4, dv: 2 });
  expect(after.updated_at).toBe(before.updated_at);
  expect(await serverItem(x)).toMatchObject({ rating: 3, dv: 2 });
  expect(await serverItem(n)).toMatchObject({ rating: 5, dv: 2 });
  for (const row of await sql("SELECT id, rating FROM items WHERE user_id = $1", [user])) {
    await until(
      () => rating(row.id),
      (r) => r === row.rating,
      `копия сошлась с сервером: ${row.id}`,
    );
  }
  await a.kill();
});
