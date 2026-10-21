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
 * Файл не завершает общую транзакцию: он выполняется через `EXECUTE` в plpgsql, и `COMMIT`,
 * `ROLLBACK` или `END` в нём Postgres отклоняет сам. Состояние сеанса следующим файлам файл
 * не оставляет: `SET` параметров вроде `search_path` после него снимает `RESET ALL`, а роль, режим
 * транзакции и временные таблицы `RESET ALL` не снимает – их в миграциях не используем.
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

    // `COMMIT` или `ROLLBACK` в файле завершили бы общую транзакцию и сняли блокировку: следующие
    // файлы шли бы без них, а упавший файл оставил бы базу наполовину. В `EXECUTE` их не принимает
    // сам Postgres – в любом написании, в отличие от разбора текста файла.
    await client.query(`CREATE FUNCTION pg_temp.run_migration(sql text) RETURNS void
      LANGUAGE plpgsql AS $$ BEGIN EXECUTE sql; END $$`);
    const applied: string[] = [];
    for (const file of files.slice(common)) {
      try {
        await client.query("SELECT pg_temp.run_migration($1)", [file.sql]);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Миграция ${file.name} не применилась: ${reason}`, { cause: error });
      }
      // Сразу после файла: его `SET` не действует ни на служебные запросы запуска, ни на следующие
      // файлы.
      await client.query("RESET ALL");
      await client.query("INSERT INTO public.schema_migrations (name, sha256) VALUES ($1, $2)", [
        file.name,
        sha256Of(file.sql),
      ]);
      applied.push(file.name);
    }
    await client.query("COMMIT");
    return { applied, unknown: appliedBefore.slice(common).map((row) => row.name) };
  } finally {
    // Соединение закрывается всегда: состояние сеанса из миграции, которое не снимает `RESET ALL`,
    // не уйдёт с ним в запросы сервера. Без COMMIT Postgres при закрытии сам откатывает
    // транзакцию и снимает блокировку; отдельный ROLLBACK на оборванном соединении упал бы и скрыл
    // исходную ошибку.
    client.release(true);
  }
}

function sha256Of(sql: string) {
  return createHash("sha256").update(sql).digest("hex");
}
