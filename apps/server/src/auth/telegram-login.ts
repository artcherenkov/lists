import type { AuthContext, BetterAuthOptions, BetterAuthPlugin } from "better-auth";

import { APIError, createAuthEndpoint, formCsrfMiddleware } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";

import { CODE_LIFETIME_MS, codeDigest, generateCode, normalizeCode } from "./telegram-code.ts";

/** Маршрут входа кодом из бота относительно `basePath` better-auth. */
export const TELEGRAM_SIGN_IN_PATH = "/sign-in/telegram-code";

/** Человек, которому бот выдаёт код, – как его видит Telegram в сообщении `/start`. */
export interface TelegramPerson {
  /** Десятичный id Telegram: он больше 2^31, а в JSON и базе это строка. */
  telegramId: string;
  name: string;
  username: string | null;
}

/** О чём плагин сообщает боту: писать в Telegram – дело бота, а не входа. */
export interface TelegramLoginEvents {
  /** Вход в аккаунт человека: бот пишет ему, когда и из какого браузера (решение 2 вехи 6). */
  signedIn(event: { telegramId: string; userAgent: string | null; at: Date }): Promise<void>;
  /** Неверных кодов за час стало больше предела: бот пишет владельцу. */
  manyWrongCodes(event: { failures: number }): Promise<void>;
}

/** Запрос кода: кто и каким сообщением `/start` его просит. */
export interface CodeRequest {
  person: TelegramPerson;
  /** Повтор того же сообщения кода не меняет. */
  messageId: number;
}

interface TelegramCode extends TelegramPerson {
  id: string;
  digest: string;
  /** Сообщение `/start`, по которому выдан код: повтор того же обновления кода не меняет. */
  messageId: number;
  expiresAt: Date;
}

const HOUR_MS = 60 * 60 * 1000;
// Опечаток хватает: 20 попыток с IP, в счёт идут все (решение 2 вехи 6). Час better-auth отсчитывает
// от последней попытки, а не от первой: счёт обнуляет только час без попыток.
const ATTEMPTS_PER_HOUR = 20;
// Столько неверных кодов за час со всех IP не наберут опечатки: это подбор.
const WRONG_CODES_ALERT = 100;

const WRONG_CODE = {
  code: "WRONG_CODE",
  message: "Код неверный или устарел: запросите новый в боте",
};

/**
 * Вход кодом из бота (решения 2–4 вехи 6). Бот выдаёт код через `issueTelegramCode`, человек
 * вводит его в приложении, маршрут `TELEGRAM_SIGN_IN_PATH` меняет код на сессию. Пользователь
 * Telegram – строка `account` с `providerId = "telegram"` и id Telegram в `accountId`; новый
 * человек получает аккаунт при первом входе, имя и username обновляются при каждом.
 */
export function telegramLogin({ events }: { events: TelegramLoginEvents }) {
  const wrongCodes = { since: 0, count: 0 };

  // Счёт в памяти процесса: сервер один, а перезапуск только отложит оповещение.
  function countWrongCode() {
    const now = Date.now();
    if (now - wrongCodes.since >= HOUR_MS) {
      wrongCodes.since = now;
      wrongCodes.count = 0;
    }
    wrongCodes.count += 1;
    if (wrongCodes.count === WRONG_CODES_ALERT + 1) {
      report("о неверных кодах", events.manyWrongCodes({ failures: wrongCodes.count }));
    }
  }

  return {
    id: "telegram-login",
    schema: {
      user: {
        fields: { telegramUsername: { type: "string", required: false, input: false } },
      },
      telegramCode: {
        fields: {
          digest: { type: "string", required: true, unique: true },
          // Один живой код у человека: новый заменяет прежний.
          telegramId: { type: "string", required: true, unique: true },
          name: { type: "string", required: true },
          username: { type: "string", required: false },
          messageId: { type: "number", required: true },
          expiresAt: { type: "date", required: true },
        },
      },
    },
    endpoints: {
      signInTelegramCode: createAuthEndpoint(
        TELEGRAM_SIGN_IN_PATH,
        // Без formCsrfMiddleware better-auth не сверяет Origin у запроса без cookie, а это и есть
        // вход: чужой сайт впустил бы человека в свой аккаунт.
        { method: "POST", use: [formCsrfMiddleware] },
        async (ctx) => {
          const input: unknown = ctx.body?.code;
          const code = typeof input === "string" ? normalizeCode(input) : null;
          // Один ответ на неизвестный, просроченный и использованный код: удаление с условием
          // срока одним запросом, и из двух одновременных входов одним кодом проходит один.
          const entry =
            code &&
            (await ctx.context.adapter.consumeOne<TelegramCode>({
              model: "telegramCode",
              where: [
                { field: "digest", value: codeDigest(code, ctx.context.secret) },
                { field: "expiresAt", operator: "gt", value: new Date() },
              ],
            }));
          if (!entry) {
            countWrongCode();
            throw new APIError("BAD_REQUEST", WRONG_CODE);
          }

          const user = await saveTelegramUser(ctx.context, entry);
          const session = await ctx.context.internalAdapter.createSession(user.id);
          await setSessionCookie(ctx, { session, user });
          report(
            "о входе",
            events.signedIn({
              telegramId: entry.telegramId,
              userAgent: ctx.request?.headers.get("user-agent") ?? null,
              at: new Date(),
            }),
          );
          return ctx.json({ user: { id: user.id, name: user.name } });
        },
      ),
    },
    rateLimit: [
      {
        pathMatcher: (path) => path === TELEGRAM_SIGN_IN_PATH,
        window: HOUR_MS / 1000,
        max: ATTEMPTS_PER_HOUR,
      },
    ],
  } satisfies BetterAuthPlugin;
}

/**
 * Выдаёт человеку новый код вместо прежнего и возвращает его. Повтор обновления с тем же
 * `/start` – `null`: Telegram доставляет обновления «хотя бы раз», а новый код заменил бы тот,
 * что человек уже вводит. Код покидает сервер только сообщением бота.
 */
export async function issueTelegramCode<Options extends BetterAuthOptions>(
  context: Pick<AuthContext<Options>, "adapter" | "secret">,
  { person, messageId }: CodeRequest,
): Promise<string | null> {
  const { adapter } = context;
  const now = new Date();
  await adapter.deleteMany({
    model: "telegramCode",
    where: [{ field: "expiresAt", operator: "lte", value: now }],
  });
  const current = await adapter.findOne<TelegramCode>({
    model: "telegramCode",
    where: [{ field: "telegramId", value: person.telegramId }],
  });
  if (current?.messageId === messageId) return null;

  for (;;) {
    const code = generateCode();
    const digest = codeDigest(code, context.secret);
    // Совпал с живым кодом другого человека: тот вошёл бы этим кодом в свой аккаунт, а этот – в
    // чужой. Тогда выдаём другой.
    const taken = await adapter.findOne<TelegramCode>({
      model: "telegramCode",
      where: [{ field: "digest", value: digest }],
    });
    if (taken) continue;

    if (current) {
      await adapter.delete({ model: "telegramCode", where: [{ field: "id", value: current.id }] });
    }
    await adapter.create<Omit<TelegramCode, "id">>({
      model: "telegramCode",
      data: { ...person, digest, messageId, expiresAt: new Date(now.getTime() + CODE_LIFETIME_MS) },
    });
    return code;
  }
}

/** Находит человека по id Telegram или заводит нового; имя и username – из последнего `/start`. */
async function saveTelegramUser(context: AuthContext, entry: TelegramCode) {
  const profile = { name: entry.name, telegramUsername: entry.username };
  const account = await context.internalAdapter.findAccountByKey({
    providerId: "telegram",
    accountId: entry.telegramId,
  });
  if (account) {
    return context.internalAdapter.updateUser(account.userId, profile);
  }
  const created = await context.internalAdapter.createOAuthUser(
    // Почта обязательна в better-auth, а у входа через Telegram её нет; `.invalid` не доставляется.
    { ...profile, email: `tg-${entry.telegramId}@telegram.invalid`, emailVerified: false },
    { providerId: "telegram", accountId: entry.telegramId },
  );
  return created.user;
}

/** Оповещение уходит без ожидания: вход не ждёт Telegram, а сбой бота не отменяет вход. */
function report(what: string, delivery: Promise<void>) {
  delivery.catch((error: unknown) => {
    console.error(`Бот не отправил оповещение ${what}:`, error);
  });
}
