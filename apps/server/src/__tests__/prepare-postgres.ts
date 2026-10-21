import { execFileSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { dropAbandonedTestDatabases } from "./test-database.ts";

/**
 * Подготовка тестов с базой (`globalSetup` проекта `db` в `vitest.config.ts`): поднимает Postgres
 * стека разработки, если он ещё не запущен, и удаляет базы, брошенные прошлыми запусками.
 * С `TEST_POSTGRES_URL` тесты идут на заданный Postgres.
 */
export default async function preparePostgres() {
  if (!process.env.TEST_POSTGRES_URL) {
    const repositoryRoot = path.join(import.meta.dirname, "../../../..");
    execFileSync("docker", ["compose", "up", "--detach", "--wait", "postgres"], {
      cwd: repositoryRoot,
      stdio: "inherit",
    });
  }
  await dropAbandonedTestDatabases();
}
