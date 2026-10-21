import { getMigrations } from "better-auth/db/migration";
import process from "node:process";

import preparePostgres from "../src/__tests__/prepare-postgres.ts";
import { TEST_AUTH_CONFIG } from "../src/__tests__/test-config.ts";
import { createTestDatabase } from "../src/__tests__/test-database.ts";
import { authOptions } from "../src/auth/auth.ts";

/**
 * Печатает в stdout SQL, которого базе после наших миграций не хватает до таблиц, ожидаемых
 * better-auth: его кладут в миграции следующим файлом, и `pnpm test:db` проверит, что он только
 * добавляет. Нужен после обновления better-auth и правки полей плагина входа. Запуск:
 * `pnpm --filter server auth:sql > src/migrations/0002_что.sql`.
 *
 * Сравнивает на временной базе тестов: в базе разработки бывают таблицы из чужих веток. Остальное
 * пишет в stderr, а при ошибке stdout оставляет пустым.
 */
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
    console.error("Таблицы входа совпадают, миграция не нужна.");
  } else {
    console.log(await plan.compileMigrations());
  }
} finally {
  await database.drop();
}
