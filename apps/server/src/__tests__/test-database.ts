import { randomUUID } from "node:crypto";
import process from "node:process";
import pg from "pg";

import { migrate } from "../database/migrate.ts";
import { readMigrations } from "../database/migration-files.ts";
import { createPool } from "../database/pool.ts";

/**
 * База для тестов сервера: своя на каждый файл или тест, удаляется в конце. Postgres по умолчанию –
 * стека разработки (`compose.yaml` в корне), его поднимает `prepare-postgres.ts`; другой задаёт
 * `TEST_POSTGRES_URL` – адрес его служебной базы `postgres`. Её же берёт `scripts/auth-sql.ts`.
 */
const TEST_POSTGRES_URL =
  process.env.TEST_POSTGRES_URL ?? "postgres://lists:lists@127.0.0.1:5440/postgres";

// Имя несёт время создания: по нему следующий запуск отличает брошенную базу от живой.
const OWNED_NAME = /^lists_test_(\d{10})_[a-f0-9]{32}$/;
const ABANDONED_AFTER_MS = 60 * 60 * 1000;

export interface TestDatabase {
  pool: pg.Pool;
  /** Адрес базы – для соединения мимо пула. */
  url: string;
  drop: () => Promise<void>;
}

/** `migrated: false` – пустая база, без наших миграций. */
export async function createTestDatabase({ migrated = true } = {}): Promise<TestDatabase> {
  const createdAt = Math.floor(Date.now() / 1000);
  const name = `lists_test_${createdAt}_${randomUUID().replaceAll("-", "")}`;
  await withAdmin((admin) => admin.query(`CREATE DATABASE ${name}`));

  const url = new URL(TEST_POSTGRES_URL);
  url.pathname = `/${name}`;
  const pool = createPool(url.href);
  const drop = async () => {
    await pool.end();
    // Без FORCE: соединение, которое тест забыл закрыть, остановит удаление и будет видно.
    await withAdmin((admin) => admin.query(`DROP DATABASE ${name}`));
  };

  if (migrated) {
    try {
      await migrate(pool, await readMigrations());
    } catch (error) {
      await drop();
      throw error;
    }
  }
  return { pool, url: url.href, drop };
}

/** Запуск, убитый до конца тестов, оставляет базу. Удаляет свои базы старше часа без подключений. */
export async function dropAbandonedTestDatabases() {
  await withAdmin(async (admin) => {
    const idle = await admin.query<{ name: string }>(
      `SELECT d.datname AS name FROM pg_database d
       WHERE NOT EXISTS (SELECT 1 FROM pg_stat_activity a WHERE a.datname = d.datname)`,
    );
    for (const { name } of idle.rows) {
      const match = OWNED_NAME.exec(name);
      if (!match || Date.now() - Number(match[1]) * 1000 < ABANDONED_AFTER_MS) continue;
      await admin.query(`DROP DATABASE IF EXISTS ${name}`);
    }
  });
}

async function withAdmin<T>(work: (admin: pg.Client) => Promise<T>): Promise<T> {
  const admin = new pg.Client({ connectionString: TEST_POSTGRES_URL });
  await admin.connect();
  try {
    return await work(admin);
  } finally {
    await admin.end();
  }
}
