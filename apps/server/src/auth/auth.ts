import type { ServerConfig } from "../config.ts";
import type { BetterAuthOptions } from "better-auth";
import type pg from "pg";

import { betterAuth } from "better-auth";
import { PostgresDialect } from "kysely";

/** Где better-auth принимает запросы; какие маршруты открыты снаружи, решает `http/app.ts`. */
export const AUTH_BASE_PATH = "/api/auth";

const YEAR_SECONDS = 365 * 24 * 60 * 60;

/** Настройки сервера, которые нужны входу. */
export type AuthConfig = Pick<ServerConfig, "publicUrl" | "authSecret">;

/**
 * Настройки better-auth (решения 5 и 13 плана, решения 3–5 вехи 6). Отдельно от `createAuth`,
 * потому что по ним же `scripts/auth-sql.ts` пишет SQL таблиц входа для миграции.
 */

export function authOptions({ pool, config }: { pool: pg.Pool; config: AuthConfig }) {
  return {
    appName: "Lists",
    baseURL: config.publicUrl,
    basePath: AUTH_BASE_PATH,
    secret: config.authSecret,
    // Таблицы – в схеме `auth`, их создают наши миграции, а не better-auth.
    database: {
      dialect: new PostgresDialect({ pool }),
      type: "postgres",
      schemaName: "auth",
      transaction: true,
    },
    session: {
      // По умолчанию 7 дней: неделя без приложения выкидывала бы человека.
      expiresIn: YEAR_SECONDS,
    },
    // Сам better-auth включает пределы только при NODE_ENV=production. В базе счётчики переживают
    // выкладку, а у тестов на своей базе они свои.
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      // Имя с `__Host-` браузер принимает только с Secure, без Domain и с Path=/, поэтому cookie
      // не подменить с соседнего поддомена; Secure для такого имени ставит сам better-auth и на
      // http://localhost. Без useSecureCookies: false он дописал бы `__Secure-` перед именем.
      cookiePrefix: "__Host-lists",
      useSecureCookies: false,
      // Под Vitest better-auth сам выключает сверку Origin; явное false – и в тестах тот же сервер.
      disableOriginCheck: false,
      // IP клиента для пределов определяет наш Caddy – он знает, каким прокси верить, – и кладёт
      // в X-Real-IP (решение 5 вехи 6). Без заголовка better-auth не находит IP, и пределы
      // становятся общими на всех; в разработке и тестах он тогда считает клиента 127.0.0.1.
      ipAddress: { ipAddressHeaders: ["x-real-ip"] },
    },
  } satisfies BetterAuthOptions;
}

export function createAuth(dependencies: { pool: pg.Pool; config: AuthConfig }) {
  return betterAuth(authOptions(dependencies));
}

export type Auth = ReturnType<typeof createAuth>;

/**
 * Сверяет таблицы входа в базе с ожидаемыми better-auth. Сам он сверяет их один раз, а при
 * несовпадении до перезапуска отвечает `500` на любой запрос; поэтому сервер сверяет до того,
 * как начать принимать запросы, и при несовпадении не стартует.
 */
export async function checkAuthSchema(auth: Auth) {
  const context = await auth.$context;
  // Сверку выключает `advanced.database.validateSchema: false`; без неё сервер молча стартовал бы
  // на чужой схеме.
  if (!context.checkSchema) {
    throw new Error("better-auth не сверяет схему базы: проверьте адаптер и advanced.database");
  }
  await context.checkSchema();
}
