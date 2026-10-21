import type { Auth } from "../../auth/auth.ts";
import type { App } from "../app.ts";
import type pg from "pg";

import { beforeAll, describe, expect, test, vi } from "vitest";

import { TEST_AUTH_CONFIG as config } from "../../__tests__/test-config.ts";
import { createTestDatabase } from "../../__tests__/test-database.ts";
import { createAuth } from "../../auth/auth.ts";
import { createPool } from "../../database/pool.ts";
import { createApp } from "../app.ts";

describe("HTTP-слой на базе с миграциями", () => {
  let pool: pg.Pool;
  let auth: Auth;
  let app: App;

  beforeAll(async () => {
    const database = await createTestDatabase();
    pool = database.pool;
    auth = createAuth({ pool, config });
    app = createApp({ auth, pool });
    return database.drop;
  });

  test("проверка здоровья отвечает 200", async () => {
    const response = await app.request("/api/health");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("проверка здоровья без базы не отвечает 200", async () => {
    const unreachable = createPool("postgres://lists:lists@127.0.0.1:1/none");
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await createApp({ auth, pool: unreachable }).request("/api/health");

      expect(response.status).toBe(500);
    } finally {
      errors.mockRestore();
      await unreachable.end();
    }
  });

  test("сессия без cookie – null", async () => {
    const response = await app.request("/api/auth/get-session");

    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  test("маршрут better-auth не из списка закрыт, хотя сам better-auth его обслуживает", async () => {
    const direct = await auth.handler(new Request("http://localhost:5175/api/auth/ok"));
    expect(direct.status).toBe(200);

    const response = await app.request("/api/auth/ok");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Не найдено" });
  });

  test("регистрация по почте и паролю закрыта", async () => {
    const response = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin: config.publicUrl },
      body: JSON.stringify({ email: "a@example.test", password: "password-123", name: "A" }),
    });

    expect(response.status).toBe(404);
  });

  test("выход с чужого сайта отклонён проверкой Origin", async () => {
    const response = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        cookie: "__Host-lists.session_token=any",
      },
      body: "{}",
    });

    expect(response.status).toBe(403);
  });

  test("пределы считаются в базе по IP из X-Real-IP от нашего Caddy", async () => {
    await app.request("/api/auth/get-session", {
      headers: { "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" },
    });

    const keys = await pool.query<{ key: string }>('SELECT key FROM auth."rateLimit"');
    expect(keys.rows.map((row) => row.key)).toContain("203.0.113.7|/get-session");
  });
});
