import type { CodeRequest } from "../auth/telegram-login.ts";
import type { BotApi, Message } from "./bot-api.ts";

import { setTimeout as sleep } from "node:timers/promises";

import { CODE_LIFETIME_MS } from "../auth/telegram-code.ts";

/** Сроки бота; тесты задают короткие. */
export interface BotTiming {
  /** Сколько Telegram держит долгий опрос без новых сообщений. */
  pollSeconds: number;
  /** Ответа нет так долго сверх срока опроса или после отправки – соединение зависло. */
  responseGraceMs: number;
  /** Пауза после неудачного опроса. */
  retryMs: number;
}

const BOT_TIMING: BotTiming = {
  // Меньше, чем прокси держит простаивающий туннель; замер – в части 5 вехи 6.
  pollSeconds: 25,
  responseGraceMs: 10_000,
  retryMs: 5_000,
};

// `/start`, `/start login` из ссылки экрана входа и `/start@имя_бота`.
const START = /^\/start(?:@\w+)?(?:\s|$)/;

export interface Bot {
  /**
   * Обрывает опрос, ждёт начатого ответа и подтверждает Telegram разобранные сообщения; остальные
   * Telegram доставит после перезапуска.
   */
  stop(): Promise<void>;
}

/**
 * Бот входа (решения 2 и 11 вехи 6): на `/start` в личном чате выдаёт человеку код и присылает
 * его. Читает сообщения долгим опросом в процессе сервера, пока не вызван `stop`; webhook до
 * сервера в России не доходит.
 */
export function startBot({
  api,
  issueCode,
  siteHost,
  timing = BOT_TIMING,
}: {
  api: BotApi;
  /** Выдаёт код вместо прежнего; повтор того же сообщения – `null` (`issueTelegramCode`). */
  issueCode: (request: CodeRequest) => Promise<string | null>;
  /** Адрес сайта в сообщении с кодом: по нему человек отличит поддельную копию. */
  siteHost: string;
  timing?: BotTiming;
}): Bot {
  const stopping = new AbortController();

  async function answer(message: Message) {
    const { from, chat, text } = message;
    // Код – только в личном чате его владельца: в группе его увидели бы все.
    if (!from || chat.type !== "private" || from.id !== chat.id) return;
    if (!text || !START.test(text)) return;
    // Старый `/start`, доставленный заново после перезапуска, кода не получает: его никто не ждёт.
    if (Date.now() - message.date * 1000 > CODE_LIFETIME_MS) return;

    const code = await issueCode({
      person: {
        telegramId: String(from.id),
        name: [from.first_name, from.last_name].filter(Boolean).join(" "),
        username: from.username ?? null,
      },
      messageId: message.message_id,
    });
    if (code === null) return;
    // Зависшая отправка держала бы и опрос: коды не получил бы никто.
    await api.sendMessage(
      chat.id,
      codeMessage(code, siteHost),
      AbortSignal.timeout(timing.responseGraceMs),
    );
  }

  async function poll() {
    let offset = 0;
    while (!stopping.signal.aborted) {
      let updates;
      try {
        updates = await api.getUpdates({
          offset,
          timeoutSeconds: timing.pollSeconds,
          signal: AbortSignal.any([
            stopping.signal,
            AbortSignal.timeout(timing.pollSeconds * 1000 + timing.responseGraceMs),
          ]),
        });
      } catch (error) {
        if (stopping.signal.aborted) break;
        console.error("Бот не получил сообщения из Telegram:", error);
        await sleep(timing.retryMs, undefined, { signal: stopping.signal }).catch(() => {});
        continue;
      }
      for (const update of updates) {
        // Каждый ответ может ждать Telegram до срока: остаток пачки задержал бы остановку дольше,
        // чем Docker ждёт процесс.
        if (stopping.signal.aborted) break;
        // Номер сдвигается и после ошибки: иначе бот повторял бы одно сообщение и не выдал бы
        // кода никому.
        offset = update.update_id + 1;
        if (!update.message) continue;
        try {
          await answer(update.message);
        } catch (error) {
          console.error(`Бот не ответил на сообщение ${update.update_id}:`, error);
        }
      }
    }
    await confirm(offset);
  }

  // Telegram считает обновления доставленными только со следующим `getUpdates`. Без него после
  // перезапуска последняя пачка пришла бы заново, и тот, кто уже вошёл, получил бы лишний код.
  async function confirm(offset: number) {
    if (offset === 0) return;
    try {
      await api.getUpdates({
        offset,
        timeoutSeconds: 0,
        signal: AbortSignal.timeout(timing.responseGraceMs),
      });
    } catch (error) {
      console.error("Бот не подтвердил Telegram последние сообщения:", error);
    }
  }

  const polling = poll();
  return {
    stop: async () => {
      stopping.abort();
      await polling;
    },
  };
}

function codeMessage(code: string, siteHost: string) {
  return [
    `Код для входа в Lists: <code>${code}</code>`,
    "",
    `Введите его на ${siteHost} в течение ${CODE_LIFETIME_MS / 60_000} минут.`,
    "Никому не сообщайте код: он впускает в ваш аккаунт.",
  ].join("\n");
}
