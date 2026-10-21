import { getMigrations } from "better-auth/db/migration";
import process from "node:process";

import preparePostgres from "../src/__tests__/prepare-postgres.ts";
import { TEST_AUTH_CONFIG } from "../src/__tests__/test-config.ts";
import { createTestDatabase } from "../src/__tests__/test-database.ts";
import { authOptions } from "../src/auth/auth.ts";

/**
 * Печатает в stdout SQL, которого базе после наших миграций не хватает до таблиц, ожидаемых
 * better-auth: его кладут в миграции следующим файлом и читают на ревью. Нужен после обновления
 * better-auth и правки полей плагина входа. Запуск: `pnpm --filter server auth:sql`.
 *
 * Сравнивает на временной базе тестов: в базе разработки бывают таблицы из чужих веток. Остальное
 * пишет в stderr, чтобы stdout можно было сразу направить в файл миграции.
 */
await preparePostgres();
const database = await createTestDatabase();
try {
  const options = authOptions({ pool: database.pool, config: TEST_AUTH_CONFIG });
  const plan = await getMigrations(options, { throwOnUnsafe: false });
  for (const problem of plan.schemaProblems) {
    console.error(`Таблицы расходятся так, что добавлением не исправить: ${problem}`);
  }
  if (plan.schemaProblems.length > 0) process.exitCode = 1;

  // Свой отказ better-auth в колонке NOT NULL без умолчания срабатывает только на таблице
  // с данными, а временная база пуста. Поэтому правки существующих таблиц проверяет ревью.
  if (plan.toBeAdded.length > 0 || plan.toBeAddedIndexes.length > 0) {
    console.error(
      "SQL меняет существующие таблицы: сверь его с правилом «миграции только добавляют» в src/database/migrate.ts.",
    );
  }
  if (plan.toBeCreated.length + plan.toBeAdded.length + plan.toBeAddedIndexes.length === 0) {
    console.error("Таблицы входа совпадают, миграция не нужна.");
  } else {
    console.log(await plan.compileMigrations());
  }
} finally {
  await database.drop();
}
