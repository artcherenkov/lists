import type { Auth } from "../auth/auth.ts";
import type pg from "pg";

import { Hono } from "hono";

import { AUTH_BASE_PATH } from "../auth/auth.ts";
import { TELEGRAM_SIGN_IN_PATH } from "../auth/telegram-login.ts";

/**
 * Маршруты better-auth, открытые снаружи. Остальные его маршруты – около 30, и новые версии
 * добавляют ещё – отвечают `404`: `disabledPaths` сравнивает путь точно и не закрыл бы новые.
 */
const AUTH_ROUTES = [
  { method: "POST", path: TELEGRAM_SIGN_IN_PATH },
  { method: "GET", path: "/get-session" },
  { method: "POST", path: "/sign-out" },
] as const;

/**
 * HTTP-слой сервера: все запросы идут под `/api/`, остальное отдаёт Caddy. `botUsername` – имя бота
 * входа без `@`.
 */
export function createApp({
  auth,
  pool,
  botUsername,
}: {
  auth: Auth;
  pool: pg.Pool;
  botUsername: string;
}) {
  const app = new Hono();

  // Проверка здоровья для выкладки: сервер жив и достаёт до базы.
  app.get("/api/health", async (c) => {
    await pool.query("SELECT 1");
    return c.json({ ok: true });
  });

  // Ссылку на бота экран входа строит из имени, которое знает сервер: сборка приложения одна на
  // все сайты, а бот у каждого свой.
  app.get("/api/telegram-bot", (c) => c.json({ username: botUsername }));

  for (const route of AUTH_ROUTES) {
    app.on(route.method, `${AUTH_BASE_PATH}${route.path}`, (c) => auth.handler(c.req.raw));
  }

  app.notFound((c) => c.json({ error: "Не найдено" }, 404));
  return app;
}

export type App = ReturnType<typeof createApp>;
