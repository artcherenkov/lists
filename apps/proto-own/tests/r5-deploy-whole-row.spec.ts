import { expect, test } from "@playwright/test";
import type { Step } from "../shared/steps.ts";
import { deployVersion } from "../server/migrate.ts";
import { pool } from "../server/db.ts";
import { api, edit, resetVersions, sql, token, uid } from "./helpers.ts";

test.afterEach(resetVersions);
test.afterAll(() => pool.end());

// Решение 20: перевод данных – одна чистая функция, общая для сервера и устройства. Устройство применяет её к строке
// целиком, поэтому сервер при выкладке тоже обязан записать всё, что шаг изменил, а не фиксированный список колонок.
// Шаг ниже трогает поля, которых нет ни в одном настоящем шаге: название и заметку.
test("выкладка записывает на сервере все поля, которые изменил шаг перевода", async () => {
  const user = uid();
  await resetVersions();
  const id = uid("row");
  const created = await api("/api/push", {
    token: await token(user), dv: 1, json: { edits: [edit(user, uid("k"), "items", id, { kind: "film", title: "Дюна", rating: 8, note: "до" })] },
  });
  expect(created.body.results[0].status).toBe("ok");

  const step: Step = {
    entity: (table, row) => (table === "items" && row.user_id === user ? { ...row, title: `${row.title} (переведена)`, note: "после", rating: 4 } : row),
    edit: (_table, fields) => fields,
  };
  await deployVersion(2, { 1: step });

  const row = (await sql("SELECT title, note, rating, dv FROM items WHERE id = $1", [id]))[0];
  expect(row).toEqual({ title: "Дюна (переведена)", note: "после", rating: 4, dv: 2 });
});
