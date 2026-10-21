import type pg from "pg";

import { beforeEach, describe, expect, test } from "vitest";

import { createTestDatabase } from "../../__tests__/test-database.ts";
import { migrate } from "../migrate.ts";
import { type Migration, readMigrations } from "../migration-files.ts";
import { onlyAddingViolations, snapshotSchema } from "./schema-snapshot.ts";

let pool: pg.Pool;

beforeEach(async () => {
  const database = await createTestDatabase({ migrated: false });
  pool = database.pool;
  return database.drop;
});

/**
 * Применяет файлы по одному и собирает нарушения правила «только добавляют» каждого. Файл
 * сравнивается со всеми прежними, границ релизов тест не знает: файл, который ужесточает таблицу
 * из невыложенного файла той же ветки, он тоже сочтёт нарушением. Такие файлы сливают в один
 * и сбрасывают базу разработки (`AGENTS.md`): применённый в ней файл изменился.
 */
async function violationsByFile(files: Migration[]) {
  const violations: string[] = [];
  let before = await snapshotSchema(pool);
  for (const [index, file] of files.entries()) {
    await migrate(pool, files.slice(0, index + 1));
    const after = await snapshotSchema(pool);
    for (const violation of onlyAddingViolations(before, after)) {
      violations.push(`${file.name}: ${violation}`);
    }
    before = after;
  }
  return violations;
}

// Если правило когда-нибудь осознанно нарушат, понадобится список исключений «файл и причина»:
// применённый файл уже не поправить.
test("каждая миграция релиза только добавляет", async () => {
  expect(await violationsByFile(await readMigrations())).toEqual([]);
});

describe("проверка правила «только добавляют»", () => {
  const base = {
    name: "0001_base.sql",
    sql: `CREATE TABLE parent (id int PRIMARY KEY);
          CREATE TABLE item (id int PRIMARY KEY, title text NOT NULL, code varchar(100), body text, status text);
          CREATE TABLE event (id int, at date) PARTITION BY RANGE (at)`,
  };

  test("новые таблицы, необязательная колонка, колонка с умолчанием или identity – можно", async () => {
    const additions = {
      name: "0002_additions.sql",
      sql: `CREATE TABLE tag (id int PRIMARY KEY, item_id int NOT NULL REFERENCES item ON DELETE CASCADE, name text UNIQUE);
            CREATE TABLE label (id int PRIMARY KEY);
            CREATE TABLE item_label (item_id int REFERENCES item ON DELETE CASCADE, label_id int NOT NULL REFERENCES label);
            ALTER TABLE item ADD COLUMN note text;
            ALTER TABLE item ADD COLUMN rank int NOT NULL DEFAULT 0;
            ALTER TABLE item ADD COLUMN seq int GENERATED ALWAYS AS IDENTITY;
            CREATE INDEX item_title_idx ON item (title)`,
    };

    expect(await violationsByFile([base, additions])).toEqual([]);
  });

  test("на существующей таблице обязательная колонка и ограничения записи – нельзя, как и ссылка на неё без CASCADE", async () => {
    const guards = {
      name: "0002_guards.sql",
      sql: `ALTER TABLE item ADD COLUMN extra text NOT NULL;
            CREATE UNIQUE INDEX item_title_uidx ON item (title);
            ALTER TABLE item ADD COLUMN parent_id int REFERENCES parent;
            ALTER TABLE item ADD CONSTRAINT item_title_check CHECK (title <> '');
            ALTER TABLE item ADD CONSTRAINT item_id_excl EXCLUDE USING btree (id WITH =);
            CREATE FUNCTION noop() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NEW; END';
            CREATE TRIGGER item_noop BEFORE INSERT ON item FOR EACH ROW EXECUTE FUNCTION noop();
            CREATE TABLE tag (id int PRIMARY KEY, item_id int REFERENCES item);
            CREATE TABLE tag_note (id int PRIMARY KEY, item_id int REFERENCES item ON DELETE SET NULL)`,
    };

    expect((await violationsByFile([base, guards])).sort()).toEqual(
      [
        "0002_guards.sql: колонка NOT NULL без умолчания public.item.extra",
        "0002_guards.sql: новый уникальный индекс item_title_uidx на существующей таблице public.item",
        "0002_guards.sql: новый внешний ключ item_parent_id_fkey на существующей таблице public.item",
        "0002_guards.sql: новый CHECK item_title_check на существующей таблице public.item",
        "0002_guards.sql: новый EXCLUDE item_id_excl на существующей таблице public.item",
        "0002_guards.sql: новый триггер item_noop на существующей таблице public.item",
        "0002_guards.sql: внешний ключ tag_item_id_fkey таблицы public.tag ссылается на существующую таблицу public.item без ON DELETE CASCADE",
        "0002_guards.sql: внешний ключ tag_note_item_id_fkey таблицы public.tag_note ссылается на существующую таблицу public.item без ON DELETE CASCADE",
      ].sort(),
    );
  });

  test("удалить или изменить колонку, в том числе дать ей умолчание, – нельзя", async () => {
    const changes = {
      name: "0002_changes.sql",
      sql: `ALTER TABLE item ALTER COLUMN title DROP NOT NULL;
            ALTER TABLE item ALTER COLUMN code TYPE varchar(5);
            ALTER TABLE item ALTER COLUMN body TYPE text COLLATE "C";
            ALTER TABLE item ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;
            ALTER TABLE item ALTER COLUMN status SET DEFAULT 'active';
            DROP TABLE parent;
            DROP TABLE event`,
    };

    expect((await violationsByFile([base, changes])).sort()).toEqual(
      [
        "0002_changes.sql: удалена таблица public.parent",
        "0002_changes.sql: удалена колонка public.parent.id",
        "0002_changes.sql: удалён уникальный индекс parent_pkey таблицы public.parent",
        "0002_changes.sql: удалена таблица public.event",
        "0002_changes.sql: удалена колонка public.event.id",
        "0002_changes.sql: удалена колонка public.event.at",
        "0002_changes.sql: изменена колонка public.item.status: text → text DEFAULT 'active'::text",
        "0002_changes.sql: изменена колонка public.item.title: text NOT NULL → text",
        "0002_changes.sql: изменена колонка public.item.code: character varying(100) → character varying(5)",
        '0002_changes.sql: изменена колонка public.item.body: text → text COLLATE "C"',
        "0002_changes.sql: изменена колонка public.item.id: integer NOT NULL → integer NOT NULL GENERATED ALWAYS AS IDENTITY",
      ].sort(),
    );
  });

  test("пересоздать таблицу, переопределить ограничение под тем же именем, сменить или убрать умолчание, сменить вычисление – нельзя", async () => {
    const guarded = {
      name: "0001_guarded.sql",
      sql: `CREATE TABLE item (
              id int PRIMARY KEY,
              title text NOT NULL DEFAULT '' CONSTRAINT item_title_check CHECK (title <> 'x'),
              status text DEFAULT 'active',
              double_id int GENERATED ALWAYS AS (id * 2) STORED
            );
            CREATE UNIQUE INDEX item_title_uidx ON item (title);
            CREATE FUNCTION touch() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NEW; END';
            CREATE TRIGGER item_touch BEFORE INSERT ON item FOR EACH ROW EXECUTE FUNCTION touch();
            CREATE FUNCTION audit() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RETURN NEW; END';
            CREATE TRIGGER item_audit AFTER INSERT ON item FOR EACH ROW EXECUTE FUNCTION audit();
            CREATE TABLE note (id int PRIMARY KEY)`,
    };
    const redefinitions = {
      name: "0002_redefinitions.sql",
      sql: `ALTER TABLE item DROP CONSTRAINT item_title_check;
            ALTER TABLE item ADD CONSTRAINT item_title_check CHECK (length(title) > 50);
            DROP INDEX item_title_uidx;
            CREATE UNIQUE INDEX item_title_uidx ON item (lower(title));
            CREATE OR REPLACE FUNCTION touch() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''нельзя''; END';
            ALTER TABLE item DISABLE TRIGGER item_audit;
            ALTER TABLE item ALTER COLUMN title DROP DEFAULT;
            ALTER TABLE item ALTER COLUMN status SET DEFAULT 'archived';
            ALTER TABLE item ALTER COLUMN double_id SET EXPRESSION AS (id * 3);
            DROP TABLE note;
            CREATE TABLE note (id int PRIMARY KEY)`,
    };

    expect((await violationsByFile([guarded, redefinitions])).sort()).toEqual(
      [
        "0002_redefinitions.sql: изменён CHECK item_title_check таблицы public.item",
        "0002_redefinitions.sql: изменён уникальный индекс item_title_uidx таблицы public.item",
        "0002_redefinitions.sql: изменён триггер item_touch таблицы public.item",
        "0002_redefinitions.sql: изменён триггер item_audit таблицы public.item",
        "0002_redefinitions.sql: изменена колонка public.item.title: text NOT NULL DEFAULT ''::text → text NOT NULL",
        "0002_redefinitions.sql: изменена колонка public.item.status: text DEFAULT 'active'::text → text DEFAULT 'archived'::text",
        "0002_redefinitions.sql: изменена колонка public.item.double_id: integer GENERATED ALWAYS AS ((id * 2)) → integer GENERATED ALWAYS AS ((id * 3))",
        "0002_redefinitions.sql: пересоздана таблица public.note",
      ].sort(),
    );
  });
});
