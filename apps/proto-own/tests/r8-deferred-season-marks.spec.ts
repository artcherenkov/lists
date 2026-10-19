import { expect, test } from "@playwright/test";
import { admin, Device, queueEmpty, resetVersions, serverItem, sql, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

// data-model, «Ошибка шага»: правка, на которой упал шаг, держит более поздние правки той же записи и её отметок.
// r3 проверяет поле записи; здесь поздняя правка – отметка сезона, чей идентификатор – не идентификатор записи. Если отметку
// отправить раньше отложенного создания записи, сервер её не знает и отклоняет: человек видит отказ на правильную отметку.
test("отметка сезона, сделанная после обновления, ждёт отложенное создание своей записи", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(info.project.name as "chromium", "A", { user, dv: 1 });
  await a.start();
  const marker: string = await a.proto("createItem", { kind: "film", title: "Маркер" });
  await queueEmpty(a);

  await a.offline();
  // Создание сериала: шаг 2→3 на этой правке упадёт, а сама запись переведётся и будет видна.
  const show: string = await a.proto("createItem", { kind: "series", title: "Сериал", tmdb_id: "777", note: "FAIL: заметка" });
  await a.restart({ dv: 3, faultyStep: true });
  expect((await a.queue()).map((e) => [e.id, e.v])).toEqual([[show, 2]]);
  expect((await a.item(show)).dv).toBe(3);

  await a.proto("markSeason", show, 1, "watched"); // уже после обновления
  await admin("/admin/deploy", { to: 3 });
  await a.online();
  // Маркер приезжает, только когда после выхода в сеть прошёл целый цикл: сначала отправка всего, что можно отправить, потом загрузка.
  await sql("UPDATE items SET note = 'маркер' WHERE id = $1", [marker]);
  await until(() => a.item(marker), (r) => r?.note === "маркер", "после выхода в сеть прошёл цикл синхронизации");
  expect(await a.rejections()).toEqual([]);
  expect(await sql("SELECT 1 FROM seasons WHERE item_id = $1", [show])).toEqual([]);

  await a.restart({ dv: 3, faultyStep: false }); // исправленная сборка: создание переводится и уходит, за ним отметка
  await queueEmpty(a);
  expect(await serverItem(show)).toMatchObject({ title: "Сериал", note: "FAIL: заметка" });
  expect(await sql("SELECT state FROM seasons WHERE id = $1", [`${show}:1`])).toEqual([{ state: "watched" }]);
  expect(await a.rejections()).toEqual([]);
  await a.kill();
});
