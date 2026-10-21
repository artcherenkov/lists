import type { getMigrations } from "better-auth/db/migration";

type MigrationPlan = Awaited<ReturnType<typeof getMigrations>>;

/**
 * Добавки better-auth к уже существующим таблицам, которые нарушают правило «миграции только
 * добавляют» – само правило записано в `src/database/migrate.ts`: колонка `NOT NULL` без
 * умолчания в SQL, уникальность, ссылка. На базе с людьми первая не применится, остальные прежний
 * релиз может нарушить. better-auth сам отказывает только в первой и только для таблицы
 * с данными, а `auth:sql` сравнивает на пустой.
 */
export function findUnsafeAdditions(
  plan: Pick<MigrationPlan, "toBeCreated" | "toBeAdded" | "toBeAddedIndexes">,
): string[] {
  const problems: string[] = [];
  for (const { table, fields } of plan.toBeAdded) {
    for (const [name, field] of Object.entries(fields)) {
      if (field.required !== false && !hasSqlDefault(field)) {
        problems.push(`${table}.${name}: колонка NOT NULL без умолчания`);
      }
      if (field.unique) problems.push(`${table}.${name}: уникальная колонка`);
      if (field.references) problems.push(`${table}.${name}: ссылка на ${field.references.model}`);
    }
  }
  const createdTables = new Set(plan.toBeCreated.map((created) => created.table));
  for (const { table, index, name } of plan.toBeAddedIndexes) {
    if (index.unique && !createdTables.has(table)) {
      problems.push(`${table}: уникальный индекс ${name}`);
    }
  }
  return problems;
}

// Когда better-auth 1.7.11 пишет умолчание в SQL (`isTimestampDefault` и `hasStaticColumnDefault`
// в `db/get-migration.mjs`): у даты – функция, она становится `CURRENT_TIMESTAMP`; у строки,
// числа и флага – постоянное значение. Остальные умолчания он подставляет только при записи.
function hasSqlDefault(field: MigrationPlan["toBeAdded"][number]["fields"][string]) {
  const value = field.defaultValue;
  if (value === undefined || value === null) return false;
  if (typeof value === "function") return field.type === "date";
  return field.type === "string" || field.type === "number" || field.type === "boolean";
}
