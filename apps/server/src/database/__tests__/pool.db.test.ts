import pg from "pg";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createTestDatabase } from "../../__tests__/test-database.ts";

let pool: pg.Pool;
let url: string;

beforeEach(async () => {
  const database = await createTestDatabase({ migrated: false });
  pool = database.pool;
  url = database.url;
  return database.drop;
});

async function backendPid(client: pg.PoolClient) {
  const { rows } = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
  return rows[0]?.pid;
}

/**
 * Обрывает соединение со стороны Postgres, как его перезапуск, и ждёт, пока пул это заметит.
 * Обрывает соединением мимо пула: иначе следующий запрос мог бы пойти по нему, а не по новому.
 */
async function terminateAndWait(pid: number | undefined) {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const killer = new pg.Client({ connectionString: url });
  try {
    await killer.connect();
    await killer.query("SELECT pg_terminate_backend($1)", [pid]);
    await vi.waitFor(() => expect(errors).toHaveBeenCalled());
  } finally {
    await killer.end();
    errors.mockRestore();
  }
}

async function nextQueryPid() {
  const { rows } = await pool.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
  return rows[0]?.pid;
}

describe("обрыв соединения не роняет процесс, следующий запрос идёт по новому", () => {
  test("простаивающего в пуле", async () => {
    const idle = await pool.connect();
    let pid: number | undefined;
    try {
      pid = await backendPid(idle);
    } finally {
      idle.release();
    }

    await terminateAndWait(pid);

    expect(await nextQueryPid()).not.toBe(pid);
  });

  test("взятого из пула между запросами", async () => {
    const held = await pool.connect();
    let pid: number | undefined;
    try {
      pid = await backendPid(held);
      await terminateAndWait(pid);
    } finally {
      // Как отдают соединение better-auth и Kysely – без ошибки: пул сам видит, что оно оборвано.
      held.release();
    }

    expect(await nextQueryPid()).not.toBe(pid);
  });
});
