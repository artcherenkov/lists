import { readFileSync } from "node:fs";
import pg from "pg";

/** Адрес Postgres – из окружения; по умолчанию – Postgres стенда тестов. */
export const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:15440/app";
export const pool = new pg.Pool({ connectionString: DATABASE_URL, max: 10 });
// Оборванное соединение в пуле не должно ронять процесс: пул откроет новое.
pool.on("error", (error) => console.error("pg pool:", error.message));

export async function setupSchema(): Promise<void> {
  await pool.query(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
}

export async function inTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
  isolation = "",
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN ${isolation}`);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setting(client: pg.Pool | pg.PoolClient, key: string): Promise<string> {
  return (await client.query("SELECT value FROM settings WHERE key = $1", [key])).rows[0].value;
}
