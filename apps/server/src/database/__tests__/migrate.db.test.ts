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
    const third = { name: "0003_third.sql", sql: "CREATE TABLE third (id int)" };
    await migrate(pool, [first, third]);

    await expect(migrate(pool, [first, second, third])).rejects.toThrow(
      "Миграции базы расходятся с релизом: 2-я в базе – 0003_third.sql, в релизе – 0002_second.sql",
    );
    expect(await tables()).not.toContain("second");
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

  test("отказывает в файле, который сам завершил транзакцию, хотя часть запуска уже закреплена", async () => {
    // `BEGIN` после `COMMIT` открывает новую транзакцию: её отказ тоже замечает.
    const commits = {
      name: "0002_commits.sql",
      sql: "CREATE TABLE commits (id int); COMMIT; BEGIN",
    };
    const third = { name: "0003_third.sql", sql: "CREATE TABLE third (id int)" };

    await expect(migrate(pool, [first, commits, third])).rejects.toThrow(
      "Миграция 0002_commits.sql сама завершила транзакцию",
    );
    expect(await tables()).toEqual(["commits", "first", "schema_migrations"]);
    expect(await appliedNames()).toEqual(["0001_first.sql"]);
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

  test("SET из файла не действует на следующие файлы, а соединение миграций не уходит в пул", async () => {
    const setsPath = { name: "0001_sets_path.sql", sql: "CREATE SCHEMA s; SET search_path = s" };
    // Роль и прочее состояние сеанса `RESET ALL` не снимает: соединение миграций закрывается.
    const next = {
      name: "0002_next.sql",
      sql: "CREATE TABLE next (id int); CREATE TABLE public.migration_pid AS SELECT pg_backend_pid() AS pid",
    };

    await migrate(pool, [setsPath, next]);

    expect(await tables()).toContain("next");
    const migration = await pool.query<{ pid: number }>("SELECT pid FROM public.migration_pid");
    const server = await pool.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
    expect(server.rows[0]?.pid).not.toBe(migration.rows[0]?.pid);
  });

  test("два одновременных запуска применяют файл один раз", async () => {
    // Пауза держит транзакцию первого запуска открытой, пока стартует второй.
    const slow = { name: "0001_slow.sql", sql: "CREATE TABLE slow (id int); SELECT pg_sleep(0.3)" };

    const results = await Promise.all([migrate(pool, [slow]), migrate(pool, [slow])]);

    expect(results.map((result) => result.applied).sort()).toEqual([[], ["0001_slow.sql"]]);
    expect(await appliedNames()).toEqual(["0001_slow.sql"]);
  });
});
