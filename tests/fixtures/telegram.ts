import type { FakeUser } from "../../apps/server/src/telegram/fake-bot-api.ts";
import type { ApiServer } from "./api-server.ts";
import type { AppServer } from "./server.ts";
import type { BrowserContext } from "@playwright/test";

import { codeInMessage } from "../../apps/server/src/telegram/__tests__/code-message.ts";

const BOT_ANSWER_TIMEOUT_MS = 10_000;

let lastTelegramId = 0;

/** Новый человек в Telegram. База сервера одна на воркер, поэтому у каждого теста свои люди. */
export function newTelegramUser(firstName = "Анна"): FakeUser {
  lastTelegramId += 1;
  return { id: 1_000_000 + lastTelegramId, firstName };
}

/** Пишет боту `/start` от имени `user` и ждёт ответ с кодом: сообщение целиком и код из него. */
export async function messageFromBot(
  api: ApiServer,
  user: FakeUser,
): Promise<{ message: string; code: string }> {
  const answeredBefore = api.telegram.sentTo(user.id).length;
  api.telegram.send(user, "/start");
  const deadline = Date.now() + BOT_ANSWER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    for (const message of api.telegram.sentTo(user.id).slice(answeredBefore)) {
      const code = codeInMessage(message);
      if (code) return { message, code };
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Бот не прислал код за ${BOT_ANSWER_TIMEOUT_MS / 1000} с`);
}

/** Пишет боту `/start` от имени `user` и ждёт код из ответа бота. */
export async function codeFromBot(api: ApiServer, user: FakeUser): Promise<string> {
  return (await messageFromBot(api, user)).code;
}

let lastClientIp = 0;

/**
 * Адрес клиента для `X-Real-IP`, свой у каждого теста: предел – 20 попыток входа с IP в час
 * (решение 2 вехи 6), а база сервера одна на воркер.
 */
export function newClientIp() {
  lastClientIp += 1;
  return `10.0.${Math.floor(lastClientIp / 250)}.${lastClientIp % 250}`;
}

/**
 * Входит в `context` без экрана входа, как с другого устройства: код у бота, вход прямо на сервере,
 * cookie сессии – в контекст. Записи о входе на устройстве нет, её создаст приложение, когда
 * сервер подтвердит сессию. Cookie не привязана к порту, поэтому её видят и сайты на других портах
 * `127.0.0.1` – переключаемые серверы тестов.
 */
export async function signInWithoutScreen(
  context: BrowserContext,
  server: AppServer,
  user: FakeUser,
  clientIp: string,
) {
  const code = await codeFromBot(server.api, user);
  const response = await context.request.post(`${server.api.url}/api/auth/sign-in/telegram-code`, {
    headers: { origin: server.url, "x-real-ip": clientIp },
    data: { code },
  });
  if (!response.ok()) {
    throw new Error(`Вход без экрана не прошёл: ${response.status()} ${await response.text()}`);
  }
}
