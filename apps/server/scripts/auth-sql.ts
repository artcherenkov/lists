import { getMigrations } from "better-auth/db/migration";
import process from "node:process";

import preparePostgres from "../src/__tests__/prepare-postgres.ts";
import { IGNORED_EVENTS, TEST_AUTH_CONFIG } from "../src/__tests__/test-config.ts";
import { createTestDatabase } from "../src/__tests__/test-database.ts";
import { authOptions } from "../src/auth/auth.ts";
import { checkNewMigrationName, writeMigration } from "../src/database/migration-files.ts";

/**
 * Кладёт в миграции новым файлом SQL, которого базе после наших миграций не хватает до таблиц,
 * ожидаемых better-auth; `pnpm test:db` затем проверит, что файл только добавляет. Нужен после
 * обновления better-auth и правки полей плагина входа. Запуск – с именем нового файла:
 * `pnpm --filter server auth:sql NNNN_name.sql`, где NNNN – следующий номер.
 *
 * Сравнивает на временной базе тестов: в базе разработки бывают таблицы из чужих веток. Если
 * добавлять нечего или расхождение добавлением не исправить, файла не создаёт.
 */
const name = process.argv[2];
if (!name) {
  console.error("Нужно имя нового файла: pnpm --filter server auth:sql NNNN_name.sql");
  process.exit(1);
}
// Имя проверяется до подъёма базы и расчёта: ошибка в нём видна сразу.
try {
  await checkNewMigrationName(name);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

await preparePostgres();
const database = await createTestDatabase();
try {
  const options = authOptions({
    pool: database.pool,
    config: TEST_AUTH_CONFIG,
    events: IGNORED_EVENTS,
  });
  const plan = await getMigrations(options);
  const nothingToAdd =
    plan.toBeCreated.length + plan.toBeAdded.length + plan.toBeAddedIndexes.length === 0;

  if (plan.schemaProblems.length > 0) {
    process.exitCode = 1;
    for (const problem of plan.schemaProblems) {
      console.error(`Таблицы расходятся так, что добавлением не исправить: ${problem}`);
    }
  } else if (nothingToAdd) {
    console.log("Таблицы входа совпадают, миграция не нужна.");
  } else {
    const file = await writeMigration(name, `${await plan.compileMigrations()}\n`);
    console.log(`Записал ${file}: проверьте его и запустите pnpm test:db.`);
  }
} finally {
  await database.drop();
}
