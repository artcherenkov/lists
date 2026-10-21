import type pg from "pg";

import { beforeEach, describe, expect, test } from "vitest";

import { createTestDatabase } from "../../__tests__/test-database.ts";
import { type Migration, migrate, readMigrations } from "../migrate.ts";
import { onlyAddingViolations, snapshotSchema } from "./schema-snapshot.ts";

let pool: pg.Pool;

beforeEach(async () => {
  const database = await createTestDatabase({ migrated: false });
  pool = database.pool;
  return database.drop;
});

/** Применяет файлы по одному и собирает нарушения правила «только добавляют» каждого. */
async function violationsByFile(files: Migration[]) {
  const violations: string[] = [];
  for (const [index, file] of files.entries()) {
    const before = await snapshotSchema(pool);
    await migrate(pool, files.slice(0, index + 1));
    const after = await snapshotSchema(pool);
    for (const violation of onlyAddingViolations(before, after)) {
      violations.push(`${file.name}: ${violation}`);
    }
  }
  return violations;
}

test("каждая миграция релиза только добавляет", async () => {
  expect(await violationsByFile(await readMigrations())).toEqual([]);
});

describe("проверка правила «только добавляют»", () => {
  const base = {
    name: "0001_base.sql",
    sql: `CREATE TABLE parent (id int PRIMARY KEY);
          CREATE TABLE item (id int PRIMARY KEY, title text NOT NULL)`,
  };

  test("новая таблица со всеми ограничениями, необязательная колонка и колонка с умолчанием – можно", async () => {
    const additions = {
      name: "0002_additions.sql",
      sql: `CREATE TABLE tag (id int PRIMARY KEY, item_id int NOT NULL REFERENCES item, name text UNIQUE);
            ALTER TABLE item ADD COLUMN note text;
            ALTER TABLE item ADD COLUMN rank int NOT NULL DEFAULT 0;
            CREATE INDEX item_title_idx ON item (title)`,
    };

    expect(await violationsByFile([base, additions])).toEqual([]);
  });

  test("на существующей таблице NOT NULL без умолчания, уникальность, ссылка, CHECK и триггер – нельзя", async () => {
    const guards = {
      name: "0002_guards.sql",
      sql: `ALTER TABLE item ADD COLUMN code text NOT NULL;
            CREATE UNIQUE INDEX item_title_uidx ON item (title);
            ALTER TABLE item ADD COLUMN parent_id int REFERENCES parent;
            ALTER TABLE item ADD CONSTRAINT item_title_check CHECK (title <> '');
            CREATE FUNCTION noop() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NEW; END';
            CREATE TRIGGER item_noop BEFORE INSERT ON item FOR EACH ROW EXECUTE FUNCTION noop()`,
    };

    expect((await violationsByFile([base, guards])).sort()).toEqual(
      [
        "0002_guards.sql: колонка NOT NULL без умолчания public.item.code",
        "0002_guards.sql: уникальный индекс на существующей таблице public.item: item_title_uidx",
        "0002_guards.sql: ссылка на существующей таблице public.item: item_parent_id_fkey",
        "0002_guards.sql: CHECK на существующей таблице public.item: item_title_check",
        "0002_guards.sql: триггер на существующей таблице public.item: item_noop",
      ].sort(),
    );
  });

  test("удалить или изменить – нельзя", async () => {
    const changes = {
      name: "0002_changes.sql",
      sql: `ALTER TABLE item ALTER COLUMN title DROP NOT NULL;
            DROP TABLE parent`,
    };

    expect((await violationsByFile([base, changes])).sort()).toEqual(
      [
        "0002_changes.sql: удалена таблица public.parent",
        "0002_changes.sql: удалена колонка public.parent.id",
        "0002_changes.sql: удалён уникальный индекс public.parent: parent_pkey",
        "0002_changes.sql: изменена колонка public.item.title",
      ].sort(),
    );
  });
});
