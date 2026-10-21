import type pg from "pg";

/**
 * Снимок схемы базы для проверки правила «миграции только добавляют» (`../migrate.ts`): таблицы,
 * колонки и всё, что ограничивает запись в таблицу, – уникальные индексы, ссылки, `CHECK`,
 * триггеры. Служебные схемы Postgres не входят.
 */
export interface SchemaSnapshot {
  tables: Set<string>;
  /** `таблица.колонка` → тип, `NOT NULL` и умолчание. */
  columns: Map<string, { table: string; definition: string; notNullWithoutDefault: boolean }>;
  /** `таблица: имя` → вид ограничения. */
  guards: Map<string, { table: string; kind: string }>;
}

const USER_SCHEMAS = "NOT IN ('pg_catalog', 'information_schema', 'pg_toast')";

export async function snapshotSchema(pool: pg.Pool): Promise<SchemaSnapshot> {
  const tables = await pool.query<{ table: string }>(
    `SELECT schemaname || '.' || tablename AS table FROM pg_tables WHERE schemaname ${USER_SCHEMAS}`,
  );
  const columns = await pool.query<{
    table: string;
    column: string;
    type: string;
    nullable: string;
    default: string | null;
  }>(
    `SELECT table_schema || '.' || table_name AS table, column_name AS column, data_type AS type,
            is_nullable AS nullable, column_default AS default
     FROM information_schema.columns WHERE table_schema ${USER_SCHEMAS}`,
  );
  const guards = await pool.query<{ table: string; name: string; kind: string }>(
    `SELECT n.nspname || '.' || t.relname AS table, i.relname AS name, 'уникальный индекс' AS kind
     FROM pg_index x
     JOIN pg_class i ON i.oid = x.indexrelid
     JOIN pg_class t ON t.oid = x.indrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE x.indisunique AND n.nspname ${USER_SCHEMAS}
     UNION ALL
     SELECT n.nspname || '.' || t.relname, c.conname,
            CASE c.contype WHEN 'f' THEN 'ссылка' ELSE 'CHECK' END
     FROM pg_constraint c
     JOIN pg_class t ON t.oid = c.conrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE c.contype IN ('f', 'c') AND n.nspname ${USER_SCHEMAS}
     UNION ALL
     SELECT n.nspname || '.' || t.relname, g.tgname, 'триггер'
     FROM pg_trigger g
     JOIN pg_class t ON t.oid = g.tgrelid
     JOIN pg_namespace n ON n.oid = t.relnamespace
     WHERE NOT g.tgisinternal AND n.nspname ${USER_SCHEMAS}`,
  );

  return {
    tables: new Set(tables.rows.map((row) => row.table)),
    columns: new Map(
      columns.rows.map((row) => [
        `${row.table}.${row.column}`,
        {
          table: row.table,
          definition: `${row.type} ${row.nullable} ${row.default ?? ""}`,
          notNullWithoutDefault: row.nullable === "NO" && row.default === null,
        },
      ]),
    ),
    guards: new Map(
      guards.rows.map((row) => [`${row.table}: ${row.name}`, { table: row.table, kind: row.kind }]),
    ),
  };
}

/**
 * Чем переход от `before` к `after` нарушает правило: в таблицах, которые были до миграции, нельзя
 * удалять и менять, добавлять колонку `NOT NULL` без умолчания и новые ограничения записи.
 * Новые таблицы – целиком можно.
 */
export function onlyAddingViolations(before: SchemaSnapshot, after: SchemaSnapshot): string[] {
  const violations: string[] = [];
  for (const table of before.tables) {
    if (!after.tables.has(table)) violations.push(`удалена таблица ${table}`);
  }
  for (const [name, column] of before.columns) {
    const now = after.columns.get(name);
    if (!now) violations.push(`удалена колонка ${name}`);
    else if (now.definition !== column.definition) violations.push(`изменена колонка ${name}`);
  }
  for (const [name, column] of after.columns) {
    if (
      before.tables.has(column.table) &&
      !before.columns.has(name) &&
      column.notNullWithoutDefault
    ) {
      violations.push(`колонка NOT NULL без умолчания ${name}`);
    }
  }
  for (const [name, guard] of before.guards) {
    if (!after.guards.has(name)) violations.push(`удалён ${guard.kind} ${name}`);
  }
  for (const [name, guard] of after.guards) {
    if (before.tables.has(guard.table) && !before.guards.has(name)) {
      violations.push(`${guard.kind} на существующей таблице ${name}`);
    }
  }
  return violations;
}
