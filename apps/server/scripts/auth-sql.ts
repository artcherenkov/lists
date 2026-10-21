import { getMigrations } from "better-auth/db/migration";
import process from "node:process";

import preparePostgres from "../src/__tests__/prepare-postgres.ts";
import { TEST_AUTH_CONFIG } from "../src/__tests__/test-config.ts";
import { createTestDatabase } from "../src/__tests__/test-database.ts";
import { authOptions } from "../src/auth/auth.ts";
import { findUnsafeAdditions } from "./unsafe-additions.ts";

/**
 * Печатает SQL, которого базе после наших миграций не хватает до таблиц, ожидаемых better-auth:
 * его кладут в миграции следующим файлом и читают на ревью. Нужен после обновления better-auth
 * и правки полей плагина входа. Запуск: `pnpm --filter server auth:sql`.
 *
 * Сравнивает на временной базе тестов: в базе разработки бывают таблицы из чужих веток. Если
 * таблицы расходятся так, что добавлением не исправить, пишет об этом и выходит с ошибкой.
 */
await preparePostgres();
const database = await createTestDatabase();
try {
  const options = authOptions({ pool: database.pool, config: TEST_AUTH_CONFIG });
  const plan = await getMigrations(options, { throwOnUnsafe: false });
  const problems = [...plan.unsafeChanges, ...plan.schemaProblems, ...findUnsafeAdditions(plan)];
  for (const problem of problems) {
    console.error(`Не сделать добавлением, нужна ручная миграция: ${problem}`);
  }
  if (problems.length > 0) process.exitCode = 1;

  const nothingToAdd =
    plan.toBeCreated.length === 0 &&
    plan.toBeAdded.length === 0 &&
    plan.toBeAddedIndexes.length === 0;
  if (!nothingToAdd) {
    console.log(await plan.compileMigrations());
  } else if (problems.length === 0) {
    console.log("-- Таблицы входа совпадают, миграция не нужна");
  }
} finally {
  await database.drop();
}
