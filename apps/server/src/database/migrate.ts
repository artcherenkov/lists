import type pg from "pg";

import { createHash } from "node:crypto";

import { type Migration, checkMigrationNames } from "./migration-files.ts";

export interface MigrationResult {
  /** Применённые этим запуском. */
  applied: string[];
  /** Применённые раньше, но неизвестные этому релизу: база новее него, это не ошибка. */
  unknown: string[];
}

// Номер блокировки миграций; любой постоянный, лишь бы не совпал с другими блокировками сервера.
const MIGRATION_LOCK = 6_000_001;

/**
 * Применяет к базе новые миграции из `migration-files.ts` одной транзакцией: упала одна –
 * не применилась ни одна. Запуски с двух процессов идут по очереди под блокировкой.
 *
 * Применённые в базе и файлы релиза должны совпадать по порядку, пока не кончится один из
 * списков: дальше в релизе – новые файлы, а в базе – файлы более нового релиза после отката.
 * Иначе – отказ: так не применится молча миграция поверх чужой, оставшейся в базе от выложенной
 * ветки или отменённого коммита, и не останется незамеченной правка применённого файла.
 *
 * Миграция только добавляет: схему, таблицу, колонку без `NOT NULL` или с умолчанием, неуникальный
 * индекс. Существующую таблицу не меняет и не пересоздаёт, не добавляет к ней того, что прежний
 * релиз может нарушить, – уникальный индекс, внешний ключ, `CHECK`, `EXCLUDE`, триггер, – и не
 * пишет данные. Внешний ключ новой таблицы на существующую – только с `ON DELETE CASCADE`, и
 * удаление по каскаду ничто не останавливает. Тогда прежний релиз работает на новой базе, и откат
 * выкладки базу не трогает (решение 9 вехи 6). Типичные нарушения ловит тест
 * `__tests__/migrations-only-add.db.test.ts`, правило целиком проверяет ревью миграции.
 *
 * Применённый файл не меняют и не удаляют, в том числе через `git revert`, даже комментарий:
 * сверка идёт по сумме всего файла. Ошибку исправляет новый файл.
 */
export async function migrate(pool: pg.Pool, migrations: Migration[]): Promise<MigrationResult> {
  checkMigrationNames(migrations.map((file) => file.name));
  const files = [...migrations].sort((a, b) => (a.name < b.name ? -1 : 1));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
    const transaction = await currentTransaction(client);
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
      // `COMMIT` или `ROLLBACK` в файле завершили бы общую транзакцию: прежние файлы остались бы
      // без следующих, а блокировка снялась бы. Отказ ловит такой файл уже в тестах.
      if ((await currentTransaction(client)) !== transaction) {
        throw new Error(
          `Миграция ${file.name} сама завершает транзакцию: уберите COMMIT и ROLLBACK`,
        );
      }
      await client.query("INSERT INTO public.schema_migrations (name, sha256) VALUES ($1, $2)", [
        file.name,
        sha256Of(file.sql),
      ]);
      applied.push(file.name);
      // Настройки из `SET` в файле не действуют на следующие файлы: иначе результат файла зависел
      // бы от того, с какими файлами он применён одним запуском. Роль `RESET ALL` не снимает.
      await client.query("RESET ALL");
    }
    await client.query("COMMIT");
    return { applied, unknown: appliedBefore.slice(common).map((row) => row.name) };
  } finally {
    // Соединение закрывается всегда: роль и прочее состояние сеанса из миграции не уйдут с ним
    // в запросы сервера. Без COMMIT Postgres при закрытии сам откатывает транзакцию и снимает
    // блокировку; отдельный ROLLBACK на оборванном соединении упал бы и скрыл исходную ошибку.
    client.release(true);
  }
}

async function currentTransaction(client: pg.PoolClient) {
  const result = await client.query<{ id: string }>("SELECT pg_current_xact_id()::text AS id");
  return result.rows[0]?.id;
}

function sha256Of(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}
