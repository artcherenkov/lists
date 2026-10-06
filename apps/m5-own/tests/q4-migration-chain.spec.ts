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

test("цепочка 1→2→3 с упавшим шагом: упавшее ждёт исправленной сборки, остальное идёт", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(info.project.name as "chromium", "A", { user, dv: 1 });
  await a.start();
  const R: string = await a.proto("createItem", {
    kind: "series",
    title: "Правится",
    tmdb_id: "4242",
    rating: 8,
  });
  const S: string = await a.proto("createItem", { kind: "film", title: "Спокойная" });
  const F: string = await a.proto("createItem", {
    kind: "film",
    title: "FAIL-известная",
    rating: 6,
    watched_month: "2024-3",
  });
  await queueEmpty(a);

  await a.offline();
  await a.proto("editItem", R, { rating: 4 }); // переводится целиком
  await a.proto("editItem", R, { note: "FAIL-заметка" }); // шаг 2→3 на этой правке упадёт
  await a.proto("markSeason", R, 1, "watched"); // более поздняя правка той же записи (отметка)
  await a.proto("editItem", R, { rating: 2 }); // и ещё одна
  await a.proto("editItem", S, { title: "Спокойная 2" }); // другая запись: идёт дальше
  const U: string = await a.proto("createItem", {
    kind: "film",
    title: "FAIL-неотправленная",
    rating: 9,
  });

  // Обновление до версии 3 без сети, сборка с ошибкой в шаге 2→3.
  await a.restart({ dv: 3, faultyStep: true });
  const visible = await a.eval(() =>
    [...document.querySelectorAll("#list li")].map((li) => (li as HTMLElement).dataset.id),
  );
  expect(visible.sort()).toEqual([R, S].sort()); // F и U скрыты, список не пуст
  expect(await a.eval(() => document.getElementById("status")!.textContent)).toContain(
    "ждут обновления 2",
  );
  expect(await Promise.all([R, S, F, U].map(async (id) => (await a.item(id)).dv))).toEqual([
    3, 3, 2, 2,
  ]);
  const versions = (await a.queue()).map((e) => [
    e.entity === "items" ? (e.fields.rating ?? e.fields.note ?? e.fields.title) : e.fields.state,
    e.v,
  ]);
  expect(versions).toEqual([
    [2, 3], // rating 4 → 2 звезды, версия 3
    ["FAIL-заметка", 2], // упавшая правка и всё позднее по той же записи ждут
    ["watched", 2],
    [1, 2], // rating 2 → 1 звезда на шаге 1→2, дальше ждёт
    ["Спокойная 2", 3], // другая запись идёт дальше
    [5, 2], // создание на устройстве: rating 9 → 5, дальше ждёт
  ]);

  // Сервер выложил версию 3; устройство в сети с той же сборкой: идут только переведённые правки.
  await admin("/admin/deploy", { to: 3 });
  await a.online();
  await until(
    () => a.queue(),
    (q) => q.length === 4,
    "ушли правки версии 3, остальные остались",
  );
  expect(await serverItem(R)).toMatchObject({ rating: 2, note: null, dv: 3 });
  expect(await serverItem(S)).toMatchObject({ title: "Спокойная 2" });
  expect(await serverItem(U)).toBeUndefined();
  // Запись, которую знает сервер, загружена заново и видна; созданная на устройстве ждёт исправления.
  await until(
    () => a.item(F),
    (r) => r.dv === 3,
    "известная серверу запись загружена заново",
  );
  expect(await a.item(F)).toMatchObject({ rating: 3, watched_month: "2024-03" });
  expect((await a.item(U)).dv).toBe(2);

  // Исправленная сборка: шаг не падает, отложенное переводится и уходит.
  await a.restart({ dv: 3, faultyStep: false });
  await queueEmpty(a);
  expect(await serverItem(R)).toMatchObject({ rating: 1, note: "FAIL-заметка", dv: 3 });
  expect(await sql("SELECT state FROM seasons WHERE id = $1", [`${R}:1`])).toEqual([
    { state: "watched" },
  ]);
  expect(await serverItem(U)).toMatchObject({ title: "FAIL-неотправленная", rating: 5, dv: 3 });
  expect((await a.item(U)).dv).toBe(3);
  await a.kill();
});
