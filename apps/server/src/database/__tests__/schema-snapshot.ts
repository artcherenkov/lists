import type pg from "pg";

/**
 * Снимок схемы базы для проверки правила «миграции только добавляют» (`../migrate.ts`): таблицы,
 * колонки и всё, что ограничивает запись в таблицу, – уникальные индексы, внешние ключи, `CHECK`,
 * `EXCLUDE`, триггеры вместе с их функциями. Служебные схемы Postgres не входят. Домены, прочие
 * функции, значения enum, последовательности, политики RLS и правила (`CREATE RULE`) снимок
 * не видит.
 */
export interface SchemaSnapshot {
  /** Таблица → её oid: пересозданная таблица выглядит так же, но строки потеряла. */
  tables: Map<string, string>;
  /** `таблица.колонка` → тип с `NOT NULL` и можно ли вставить строку, не задав колонку. */
  columns: Map<string, { table: string; definition: string; optionalOnInsert: boolean }>;
  /** `таблица вид имя` → ограничение записи. */
  guards: Map<string, Guard>;
}

interface Guard {
  table: string;
  kind: string;
  name: string;
  definition: string;
  /**
   * Таблица, в которой внешний ключ не даёт удалять строки, на которые ссылается: у него нет
   * `ON DELETE CASCADE`, `SET NULL` или `SET DEFAULT`.
   */
  blocksDeleteIn: string | null;
}

// Схемы, которые создаёт сам Postgres: pg_catalog, pg_toast, временные и information_schema.
const USER_SCHEMA = "n.nspname !~ '^pg_' AND n.nspname <> 'information_schema'";

export async function snapshotSchema(pool: pg.Pool): Promise<SchemaSnapshot> {
  const [tables, columns, guards] = await Promise.all([
    pool.query<{ table: string; oid: string }>(
      `SELECT n.nspname || '.' || c.relname AS table, c.oid::text AS oid
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE c.relkind IN ('r', 'p') AND ${USER_SCHEMA}`,
    ),
    pool.query<{ table: string; column: string; definition: string; optionalOnInsert: boolean }>(
      `SELECT n.nspname || '.' || c.relname AS table, a.attname AS column,
              format_type(a.atttypid, a.atttypmod)
                || CASE WHEN a.attcollation <> t.typcollation
                        THEN ' COLLATE ' || quote_ident(co.collname) ELSE '' END
                || CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END AS definition,
              NOT a.attnotnull OR a.atthasdef OR a.attidentity <> '' AS "optionalOnInsert"
       FROM pg_attribute a
       JOIN pg_class c ON c.oid = a.attrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       JOIN pg_type t ON t.oid = a.atttypid
       LEFT JOIN pg_collation co ON co.oid = a.attcollation
       WHERE c.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped AND ${USER_SCHEMA}`,
    ),
    pool.query<Guard>(
      `SELECT n.nspname || '.' || c.relname AS table, 'уникальный индекс' AS kind,
              i.relname AS name, pg_get_indexdef(x.indexrelid) AS definition,
              NULL AS "blocksDeleteIn"
       FROM pg_index x
       JOIN pg_class i ON i.oid = x.indexrelid
       JOIN pg_class c ON c.oid = x.indrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE x.indisunique AND ${USER_SCHEMA}
       UNION ALL
       SELECT n.nspname || '.' || c.relname,
              CASE k.contype WHEN 'f' THEN 'внешний ключ' WHEN 'c' THEN 'CHECK' ELSE 'EXCLUDE' END,
              k.conname, pg_get_constraintdef(k.oid),
              CASE WHEN k.contype = 'f' AND k.confdeltype IN ('a', 'r')
                   THEN rn.nspname || '.' || r.relname END
       FROM pg_constraint k
       JOIN pg_class c ON c.oid = k.conrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       LEFT JOIN pg_class r ON r.oid = k.confrelid
       LEFT JOIN pg_namespace rn ON rn.oid = r.relnamespace
       WHERE k.contype IN ('f', 'c', 'x') AND ${USER_SCHEMA}
       UNION ALL
       SELECT n.nspname || '.' || c.relname, 'триггер', g.tgname,
              pg_get_triggerdef(g.oid) || ' ' || g.tgenabled::text || ' '
                || pg_get_functiondef(g.tgfoid),
              NULL
       FROM pg_trigger g
       JOIN pg_class c ON c.oid = g.tgrelid
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE NOT g.tgisinternal AND ${USER_SCHEMA}`,
    ),
  ]);

  return {
    tables: new Map(tables.rows.map((row) => [row.table, row.oid])),
    columns: new Map(
      columns.rows.map(({ table, column, definition, optionalOnInsert }) => [
        `${table}.${column}`,
        { table, definition, optionalOnInsert },
      ]),
    ),
    guards: new Map(
      guards.rows.map((guard) => [`${guard.table} ${guard.kind} ${guard.name}`, guard]),
    ),
  };
}

/**
 * Чем переход от `before` к `after` нарушает правило. В таблицах, которые были до миграции, нельзя
 * удалять, менять и пересоздавать, добавлять колонку, без которой не вставить строку, и новые
 * ограничения записи. Новые таблицы – целиком можно, кроме внешнего ключа, который не даёт удалять
 * строки существующей таблицы: прежний релиз о нём не знает.
 */
export function onlyAddingViolations(before: SchemaSnapshot, after: SchemaSnapshot): string[] {
  const violations: string[] = [];
  for (const [table, oid] of before.tables) {
    const now = after.tables.get(table);
    if (now === undefined) violations.push(`удалена таблица ${table}`);
    else if (now !== oid) violations.push(`пересоздана таблица ${table}`);
  }
  for (const [name, column] of before.columns) {
    const now = after.columns.get(name);
    if (!now) violations.push(`удалена колонка ${name}`);
    else if (now.definition !== column.definition) {
      violations.push(`изменена колонка ${name}: ${column.definition} → ${now.definition}`);
    } else if (column.optionalOnInsert && !now.optionalOnInsert) {
      violations.push(`колонку ${name} стало нужно задавать при вставке`);
    }
  }
  for (const [name, column] of after.columns) {
    if (before.tables.has(column.table) && !before.columns.has(name) && !column.optionalOnInsert) {
      violations.push(`колонка NOT NULL без умолчания ${name}`);
    }
  }
  for (const [key, guard] of before.guards) {
    const now = after.guards.get(key);
    if (!now) violations.push(`удалён ${guard.kind} ${guard.name} таблицы ${guard.table}`);
    else if (now.definition !== guard.definition) {
      violations.push(`изменён ${guard.kind} ${guard.name} таблицы ${guard.table}`);
    }
  }
  for (const [key, guard] of after.guards) {
    if (before.guards.has(key)) continue;
    if (before.tables.has(guard.table)) {
      violations.push(`новый ${guard.kind} ${guard.name} на существующей таблице ${guard.table}`);
    } else if (guard.blocksDeleteIn && before.tables.has(guard.blocksDeleteIn)) {
      violations.push(
        `${guard.kind} ${guard.name} таблицы ${guard.table} не даёт удалять строки существующей таблицы ${guard.blocksDeleteIn}`,
      );
    }
  }
  return violations;
}
