import { getMigrations } from "better-auth/db/migration";
import process from "node:process";

import preparePostgres from "../src/__tests__/prepare-postgres.ts";
import { TEST_AUTH_CONFIG } from "../src/__tests__/test-config.ts";
import { createTestDatabase } from "../src/__tests__/test-database.ts";
import { authOptions } from "../src/auth/auth.ts";
import { writeMigration } from "../src/database/migrate.ts";

/**
 * Кладёт в миграции новым файлом SQL, которого базе после наших миграций не хватает до таблиц,
 * ожидаемых better-auth; `pnpm test:db` затем проверит, что файл только добавляет. Нужен после
 * обновления better-auth и правки полей плагина входа. Запуск – с именем нового файла:
 * `pnpm --filter server auth:sql 0002_что.sql`.
 *
 * Сравнивает на временной базе тестов: в базе разработки бывают таблицы из чужих веток. Если
 * добавлять нечего или расхождение добавлением не исправить, файла не создаёт.
 */
const name = process.argv[2];
if (!name) {
  console.error("Нужно имя нового файла миграции: pnpm --filter server auth:sql 0002_что.sql");
  process.exit(1);
}

await preparePostgres();
const database = await createTestDatabase();
try {
  const options = authOptions({ pool: database.pool, config: TEST_AUTH_CONFIG });
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
