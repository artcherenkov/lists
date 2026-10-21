import type { getMigrations } from "better-auth/db/migration";

type MigrationPlan = Awaited<ReturnType<typeof getMigrations>>;

/**
 * Добавки better-auth к уже существующим таблицам, которые нарушают правило «миграции только
 * добавляют» (`src/database/migrate.ts`): колонка `NOT NULL` без умолчания, уникальность, ссылка.
 * На базе с людьми первая не применится, остальные прежний релиз может нарушить. better-auth сам
 * отказывает только в первой и только для таблицы с данными, а `auth:sql` сравнивает на пустой.
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

// Когда better-auth пишет умолчание в SQL: постоянное значение, а у даты – функция (now()).
function hasSqlDefault(field: MigrationPlan["toBeAdded"][number]["fields"][string]) {
  if (field.defaultValue === undefined || field.defaultValue === null) return false;
  if (typeof field.defaultValue === "function") return field.type === "date";
  return true;
}
