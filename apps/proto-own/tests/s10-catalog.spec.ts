import { expect, test } from "@playwright/test";

import { api, Device, queueEmpty, sql, token, uid, until } from "./helpers.ts";

const show = (id: string, title: string) =>
  sql(
    "INSERT INTO shows (id, title) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title",
    [id, title],
  );

test("10. сериал из каталога приезжает, когда человек добавил запись, и уходит, когда удалил; правка каталога доходит", async ({}, info) => {
  const user = uid();
  const tmdb = uid("tmdb");
  const other = uid("tmdb");
  const d = Device.create(info.project.name as "chromium", "A", { user });
  await d.start();
  await show(tmdb, "Сериал v1");
  await show(other, "Чужой сериал");
  await d.proto("createItem", { kind: "film", title: "Фильм, чтобы продвинуть загрузку" });
  await queueEmpty(d);
  expect(await d.showIds()).toEqual([]); // сериал в каталоге есть, а в списке человека его нет

  // Сериал лежит в каталоге давно: его номер меньше контрольной точки устройства.
  const id: string = await d.proto("createItem", {
    kind: "series",
    title: "Сериал",
    tmdb_id: tmdb,
  });
  await until(
    () => d.showIds(),
    (ids) => ids.includes(tmdb),
    "сериал приехал после добавления записи",
  );
  expect(await d.showIds()).not.toContain(other);
  expect(await d.show(tmdb)).toMatchObject({ title: "Сериал v1" });

  await show(tmdb, "Сериал v2"); // ежедневная задача обновила каталог
  await until(
    () => d.show(tmdb),
    (s) => s?.title === "Сериал v2",
    "правка каталога дошла",
  );

  await d.proto("deleteItem", id);
  await until(
    () => d.showIds(),
    (ids) => !ids.includes(tmdb),
    "сериал ушёл после удаления записи",
  );

  await d.proto("restoreItem", id); // «Отменить»
  await until(
    () => d.showIds(),
    (ids) => ids.includes(tmdb),
    "сериал вернулся",
  );

  // Другой человек сериал не получает.
  const stranger = (await api("/api/pull?cp=0", { token: await token(uid("bob")), dv: 1 })).body;
  expect(stranger.shows).toEqual([]);
  await d.kill();
});
