import type pg from "pg";

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/**
 * Миграции базы – SQL-файлы `0001_<что>.sql` в каталоге миграций; применяются по порядку имён.
 * Миграция только добавляет: схему, таблицу, колонку без `NOT NULL` или с умолчанием, неуникальный
 * индекс. К существующей таблице не добавляет того, что прежний релиз может нарушить, – уникальный
 * индекс, ссылку, `CHECK`, триггер – и не пишет данные. Тогда прежний релиз работает на новой
 * базе, и откат выкладки базу не трогает (решение 9 вехи 6). Правило на каждом файле релиза
 * проверяет `__tests__/migrations-only-add.db.test.ts`; данные он не видит – их проверяет ревью.
 *
 * Применённый файл не меняют и не удаляют, в том числе через `git revert`, даже комментарий:
 * сверка идёт по сумме всего файла. Ошибку исправляет новый файл.
 */
export interface Migration {
  name: string;
  sql: string;
}

export interface MigrationResult {
  /** Применённые этим запуском. */
  applied: string[];
  /** Применённые раньше, но неизвестные этому релизу: база новее него, это не ошибка. */
  unknown: string[];
}

// Номер блокировки миграций; любой постоянный, лишь бы не совпал с другими блокировками сервера.
const MIGRATION_LOCK = 6_000_001;

// Номер в имени задаёт порядок: файл без номера встал бы после всех и заблокировал следующий.
const MIGRATION_NAME = /^\d{4}_[a-z0-9_]+\.sql$/;

// Где лежат миграции, знает только этот модуль.
const MIGRATIONS_DIR = path.join(import.meta.dirname, "../migrations");

/** Миграции этого релиза. */
export async function readMigrations(): Promise<Migration[]> {
  const names = (await readdir(MIGRATIONS_DIR)).filter((name) => name.endsWith(".sql"));
  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(path.join(MIGRATIONS_DIR, name), "utf8"),
    })),
  );
}

/**
 * Применяет новые миграции одной транзакцией: упала одна – не применилась ни одна. Запуски
 * с двух процессов идут по очереди под блокировкой.
 *
 * Применённые в базе и файлы релиза должны совпадать по порядку, пока не кончится один из
 * списков: дальше в релизе – новые файлы, а в базе – файлы более нового релиза после отката.
 * Иначе – отказ: так не применится молча миграция поверх чужой, оставшейся в базе от выложенной
 * ветки или отменённого коммита, и не останется незамеченной правка применённого файла.
 */
export async function migrate(pool: pg.Pool, migrations: Migration[]): Promise<MigrationResult> {
  const misnamed = migrations.filter((file) => !MIGRATION_NAME.test(file.name));
  if (misnamed.length > 0) {
    throw new Error(
      `Имя миграции не по образцу 0001_что.sql: ${misnamed.map((file) => file.name).join(", ")}`,
    );
  }
  // Две ветки взяли один номер. Если первым выложен файл, который по имени идёт позже, следующий
  // релиз разойдётся с базой; отказ ловит это ещё на тестах после слияния.
  const numbers = migrations.map((file) => file.name.slice(0, 4));
  const repeated = numbers.filter((number, index) => numbers.indexOf(number) !== index);
  if (repeated.length > 0) {
    throw new Error(`Номер миграции повторяется: ${[...new Set(repeated)].join(", ")}`);
  }
  const files = [...migrations].sort((a, b) => (a.name < b.name ? -1 : 1));
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY,
      sha256 text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const rows = await client.query<{ name: string; sha256: string }>(
      "SELECT name, sha256 FROM public.schema_migrations",
    );
    const appliedBefore = rows.rows.sort((a, b) => (a.name < b.name ? -1 : 1));

    const common = Math.min(appliedBefore.length, files.length);
    for (const [index, file] of files.slice(0, common).entries()) {
      const inDatabase = appliedBefore[index];
      if (inDatabase?.name !== file.name) {
        throw new Error(
          `Миграции базы расходятся с релизом: ${index + 1}-я в базе – ${inDatabase?.name}, в релизе – ${file.name}`,
        );
      }
      if (inDatabase.sha256 !== sha256Of(file.sql)) {
        throw new Error(`Применённая миграция ${file.name} изменена`);
      }
    }

    const applied: string[] = [];
    for (const file of files.slice(common)) {
      await client.query(file.sql);
      await client.query("INSERT INTO public.schema_migrations (name, sha256) VALUES ($1, $2)", [
        file.name,
        sha256Of(file.sql),
      ]);
      applied.push(file.name);
    }
    await client.query("COMMIT");
    committed = true;
    return { applied, unknown: appliedBefore.slice(common).map((row) => row.name) };
  } finally {
    // Без COMMIT пул закрывает соединение, и Postgres сам откатывает транзакцию и снимает
    // блокировку; отдельный ROLLBACK на оборванном соединении упал бы и скрыл исходную ошибку.
    client.release(!committed);
  }
}

function sha256Of(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}
