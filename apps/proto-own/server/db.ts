import { readFileSync } from "node:fs";
import pg from "pg";

export const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 15435,
  user: "postgres",
  password: "postgres",
  database: "app",
  max: 10,
});

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
