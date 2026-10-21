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
const third = { name: "0003_third.sql", sql: "CREATE TABLE third (id int)" };

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

    await expect(migrate(pool, [first, broken])).rejects.toThrow(
      'Миграция 0002_broken.sql не применилась: type "no_such_type" does not exist',
    );
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
    await migrate(pool, [first, third]);

    await expect(migrate(pool, [first, second, third])).rejects.toThrow(
      "Миграции базы расходятся с релизом: 2-я в базе – 0003_third.sql, в релизе – 0002_second.sql",
    );
    expect(await tables()).not.toContain("second");
  });

  test("отказывает, если в базе осталась миграция ветки, которой нет в релизе", async () => {
    const branch = { name: "0002_branch.sql", sql: "CREATE TABLE branch (id int)" };
    await migrate(pool, [first, branch]);

    await expect(migrate(pool, [first, second, third])).rejects.toThrow(
      "Миграции базы расходятся с релизом: 2-я в базе – 0002_branch.sql, в релизе – 0002_second.sql",
    );
    expect(await tables()).not.toContain("third");
  });

  test.each([
    "CREATE TABLE ends (id int);\nEND;",
    "BEGIN;\nCREATE TABLE ends (id int);",
    "CREATE TABLE ends (id int);\ncommit;",
    "CREATE TABLE ends (id int); /* готово */ COMMIT",
    "CREATE TABLE ends (id int); ROLLBACK",
    "CREATE TABLE ends (id int); ABORT",
  ])(
    "отказывает в файле, который сам управляет транзакцией, ничего не применяя: %j",
    async (sql) => {
      const ends = { name: "0002_ends.sql", sql };

      await expect(migrate(pool, [first, ends])).rejects.toThrow(
        "Миграция 0002_ends.sql не применилась: EXECUTE of transaction commands is not implemented",
      );
      expect(await tables()).toEqual([]);
    },
  );

  test("слова commit и rollback в колонке и строке – не управление транзакцией", async () => {
    const lookalike = {
      name: "0002_lookalike.sql",
      sql: "CREATE TABLE log (\n  commit text\n);\nCOMMENT ON TABLE log IS 'x; rollback later'",
    };

    expect((await migrate(pool, [first, lookalike])).applied).toEqual([
      "0001_first.sql",
      "0002_lookalike.sql",
    ]);
  });

  test("уборка временных объектов в файле не мешает следующим файлам", async () => {
    const cleanup = { name: "0002_cleanup.sql", sql: "CREATE TABLE kept (id int); DISCARD TEMP" };

    expect((await migrate(pool, [first, cleanup, third])).applied).toEqual([
      "0001_first.sql",
      "0002_cleanup.sql",
      "0003_third.sql",
    ]);
  });

  test("файл, текст которого Postgres не принял, назван в ошибке", async () => {
    const nul = { name: "0002_nul.sql", sql: "CREATE TABLE nul (id int);\u0000" };

    await expect(migrate(pool, [first, nul])).rejects.toThrow(
      "Миграция 0002_nul.sql не применилась: invalid byte sequence",
    );
    expect(await tables()).toEqual([]);
  });

  test("отказывает в файле без номера в имени, ничего не применяя", async () => {
    const unnumbered = { name: "fix_auth.sql", sql: "CREATE TABLE fix (id int)" };

    await expect(migrate(pool, [first, unnumbered])).rejects.toThrow(
      "Имя миграции не по образцу NNNN_name.sql – номер из четырёх цифр, _, строчная латиница, цифры и _: fix_auth.sql",
    );
    expect(await tables()).toEqual([]);
  });

  test("отказывает, если две миграции взяли один номер", async () => {
    const twin = { name: "0002_twin.sql", sql: "CREATE TABLE twin (id int)" };

    await expect(migrate(pool, [first, second, twin])).rejects.toThrow(
      "Номер миграции повторяется: 0002",
    );
    expect(await tables()).toEqual([]);
  });

  test("база новее релиза – не ошибка: применённые неизвестные файлы перечисляются", async () => {
    await migrate(pool, [first, second]);

    expect(await migrate(pool, [first])).toEqual({ applied: [], unknown: ["0002_second.sql"] });
  });

  test("SET из файла не действует на следующие файлы, а состояние сеанса миграций – на запросы сервера", async () => {
    const setsPath = { name: "0001_sets_path.sql", sql: "CREATE SCHEMA s; SET search_path = s" };
    // Временную таблицу, как и роль, `RESET ALL` не снимает.
    const next = {
      name: "0002_next.sql",
      sql: "CREATE TABLE next (id int); CREATE TEMP TABLE leaked (id int)",
    };

    await migrate(pool, [setsPath, next]);

    expect(await tables()).toContain("next");
    const leaked = await pool.query<{ table: string | null }>(
      "SELECT to_regclass('pg_temp.leaked')::text AS table",
    );
    expect(leaked.rows[0]?.table).toBeNull();
  });

  test("два одновременных запуска применяют файл один раз", async () => {
    // Пауза держит транзакцию первого запуска открытой, пока стартует второй.
    const slow = { name: "0001_slow.sql", sql: "CREATE TABLE slow (id int); SELECT pg_sleep(0.3)" };

    const results = await Promise.all([migrate(pool, [slow]), migrate(pool, [slow])]);

    expect(results.map((result) => result.applied).sort()).toEqual([[], ["0001_slow.sql"]]);
    expect(await appliedNames()).toEqual(["0001_slow.sql"]);
  });
});
