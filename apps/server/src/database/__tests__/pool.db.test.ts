import type pg from "pg";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { createTestDatabase } from "../../__tests__/test-database.ts";

let pool: pg.Pool;

beforeEach(async () => {
  const database = await createTestDatabase({ migrated: false });
  pool = database.pool;
  return database.drop;
});

async function backendPid(client: pg.PoolClient) {
  const { rows } = await client.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");
  return rows[0]?.pid;
}

/** Обрывает соединение со стороны Postgres, как его перезапуск, и ждёт, пока пул это заметит. */
async function terminateAndWait(killer: pg.PoolClient, pid: number | undefined) {
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  await killer.query("SELECT pg_terminate_backend($1)", [pid]);
  await vi.waitFor(() => expect(errors).toHaveBeenCalled());
  errors.mockRestore();
}

describe("обрыв соединения не роняет процесс, следующий запрос идёт по новому", () => {
  test("простаивающего в пуле", async () => {
    const idle = await pool.connect();
    const killer = await pool.connect();
    const pid = await backendPid(idle);
    idle.release();

    await terminateAndWait(killer, pid);
    killer.release();

    await expect(pool.query("SELECT 1 AS one")).resolves.toMatchObject({ rows: [{ one: 1 }] });
  });

  test("взятого из пула между запросами", async () => {
    const held = await pool.connect();
    const killer = await pool.connect();

    await terminateAndWait(killer, await backendPid(held));
    killer.release();
    held.release(true);

    await expect(pool.query("SELECT 1 AS one")).resolves.toMatchObject({ rows: [{ one: 1 }] });
  });
});
