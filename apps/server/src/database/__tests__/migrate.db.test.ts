import type pg from "pg";

import { beforeEach, describe, expect, test } from "vitest";

import { createTestDatabase } from "../../__tests__/test-database.ts";
import { migrate } from "../migrate.ts";

let pool: pg.Pool;

beforeEach(async () => {
  const database = await createTestDatabase({ migrated: false });
  pool = database.pool;
  return database.drop;
});

async function tables() {
  const result = await pool.query<{ name: string }>(
    "SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  return result.rows.map((row) => row.name);
}

async function appliedNames() {
  const result = await pool.query<{ name: string }>(
    "SELECT name FROM public.schema_migrations ORDER BY name",
  );
  return result.rows.map((row) => row.name);
}

const first = { name: "0001_first.sql", sql: "CREATE TABLE first (id int)" };
const second = { name: "0002_second.sql", sql: "CREATE TABLE second (id int)" };

describe("миграции", () => {
  test("применяет новые файлы по порядку, повторный запуск ничего не применяет", async () => {
    expect(await migrate(pool, [first, second])).toEqual({
      applied: ["0001_first.sql", "0002_second.sql"],
      unknown: [],
    });
    expect(await tables()).toEqual(["first", "schema_migrations", "second"]);

    expect(await migrate(pool, [first, second])).toEqual({ applied: [], unknown: [] });
    expect(await appliedNames()).toEqual(["0001_first.sql", "0002_second.sql"]);
  });

  test("упавший файл откатывает весь запуск: не применяется ни один", async () => {
    const broken = { name: "0002_broken.sql", sql: "CREATE TABLE broken (id no_such_type)" };

    await expect(migrate(pool, [first, broken])).rejects.toThrow('type "no_such_type"');
    expect(await tables()).toEqual([]);
  });

  test("отказывает, если применённый файл изменён, и не применяет новые", async () => {
    await migrate(pool, [first]);
    const changed = { name: first.name, sql: "CREATE TABLE first (id bigint)" };

    await expect(migrate(pool, [changed, second])).rejects.toThrow(
      "Применённая миграция 0001_first.sql изменена",
    );
    expect(await appliedNames()).toEqual(["0001_first.sql"]);
  });

  test("отказывает в новом файле, который по имени встаёт перед применённым", async () => {
    await migrate(pool, [first, second]);
    const late = { name: "0001_late.sql", sql: "CREATE TABLE late (id int)" };

    await expect(migrate(pool, [first, late, second])).rejects.toThrow(
      "Миграции базы расходятся с релизом: 2-я в базе – 0002_second.sql, в релизе – 0001_late.sql",
    );
    expect(await tables()).not.toContain("late");
  });

  test("отказывает, если в базе осталась миграция ветки, которой нет в релизе", async () => {
    const branch = { name: "0002_branch.sql", sql: "CREATE TABLE branch (id int)" };
    await migrate(pool, [first, branch]);
    const third = { name: "0003_third.sql", sql: "CREATE TABLE third (id int)" };

    await expect(migrate(pool, [first, second, third])).rejects.toThrow(
      "Миграции базы расходятся с релизом: 2-я в базе – 0002_branch.sql, в релизе – 0002_second.sql",
    );
    expect(await tables()).not.toContain("third");
  });

  test("база новее релиза – не ошибка: применённые неизвестные файлы перечисляются", async () => {
    await migrate(pool, [first, second]);

    expect(await migrate(pool, [first])).toEqual({ applied: [], unknown: ["0002_second.sql"] });
  });

  test("два одновременных запуска применяют файл один раз", async () => {
    // Пауза держит транзакцию первого запуска открытой, пока стартует второй.
    const slow = { name: "0001_slow.sql", sql: "CREATE TABLE slow (id int); SELECT pg_sleep(0.3)" };

    const results = await Promise.all([migrate(pool, [slow]), migrate(pool, [slow])]);

    expect(results.map((result) => result.applied).sort()).toEqual([[], ["0001_slow.sql"]]);
    expect(await appliedNames()).toEqual(["0001_slow.sql"]);
  });
});
