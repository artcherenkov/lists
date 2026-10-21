import type { Message, Update } from "./bot-api.ts";
import type { AddressInfo } from "node:net";

import { serve } from "@hono/node-server";
import { Hono } from "hono";

/** Человек, который пишет боту через подделку. */
export interface FakeUser {
  id: number;
  firstName: string;
  username?: string;
}

export interface FakeBotApi {
  /** Адрес для `TELEGRAM_API_URL`. */
  url: string;
  /** Человек пишет боту в личный чат; `date` – время отправки, по умолчанию сейчас. */
  send(from: FakeUser, text: string, date?: Date): void;
  /**
   * Сообщение в любом виде: из группы, без отправителя или с номером уже доставленного – Telegram
   * доставляет обновления «хотя бы раз».
   */
  sendUpdate(message: Omit<Message, "message_id"> & { message_id?: number }): void;
  /** Что бот прислал в чат, по порядку, – как это покажет Telegram. */
  sentTo(chatId: number): string[];
  /**
   * Запросы метода остаются без ответа, как через зависший прокси, пока не вызван `resume`; уже
   * зависшие ответа не получат. `arrived` – первый такой запрос дошёл до подделки.
   */
  stall(method: "getUpdates" | "sendMessage"): { arrived: Promise<void>; resume(): void };
  close(): Promise<void>;
}

/**
 * Подделка Bot API для разработки и тестов (решение 11 вехи 6): бот говорит с ней, как с Telegram,
 * – `getUpdates` с долгим опросом и `sendMessage`, – а человека изображает `send`. Через неё можно
 * войти под любым id Telegram, поэтому `main.ts` её не импортирует и в боевой бандл она не
 * попадает, а сервер в боевой работе принимает только адрес Telegram (`config.ts`).
 */
export async function startFakeBotApi({
  token,
  port = 0,
  onSent,
}: {
  token: string;
  port?: number;
  /** Бот прислал сообщение – текст, как его покажет Telegram: в разработке его печатает консоль. */
  onSent?: (chatId: number, text: string) => void;
}): Promise<FakeBotApi> {
  const updates: Update[] = [];
  const sent: { chatId: number; text: string }[] = [];
  const waiting = new Set<() => void>();
  // Метод, который не отвечает, и что сделать, когда его запрос дойдёт.
  const stalled = new Map<string, () => void>();
  // После `close` ни один запрос не ждёт: иначе сервер ждал бы конца его срока.
  let closed = () => {};
  const closing = new Promise<void>((resolve) => {
    closed = resolve;
  });
  let nextUpdateId = 1;
  let nextMessageId = 1;

  function push(message: Omit<Message, "message_id"> & { message_id?: number }) {
    updates.push({
      update_id: nextUpdateId++,
      message: { ...message, message_id: message.message_id ?? nextMessageId++ },
    });
    for (const wake of waiting) wake();
  }

  function waitForUpdate(timeoutMs: number) {
    return new Promise<void>((resolve) => {
      const wake = () => {
        clearTimeout(timer);
        waiting.delete(wake);
        resolve();
      };
      const timer = setTimeout(wake, timeoutMs);
      waiting.add(wake);
      void closing.then(wake);
    });
  }

  const app = new Hono();
  // Без keep-alive: соединение, которое ответило уже после `close`, держало бы закрытие секунды.
  app.use(async (c, next) => {
    c.header("Connection", "close");
    await next();
  });
  app.post("/:bot/:method", async (c) => {
    if (c.req.param("bot") !== `bot${token}`) {
      return c.json({ ok: false, description: "Unauthorized" }, 401);
    }
    const params = await c.req.json();
    const method = c.req.param("method");
    const onStalled = stalled.get(method);
    if (onStalled) {
      onStalled();
      await closing;
      return c.json({ ok: false, description: "Closed" }, 503);
    }
    switch (method) {
      case "getUpdates": {
        const offset: number = params.offset ?? 0;
        // Как Telegram: номер `offset` подтверждает всё, что до него.
        updates.splice(0, updates.filter((update) => update.update_id < offset).length);
        if (updates.length === 0 && params.timeout > 0) await waitForUpdate(params.timeout * 1000);
        return c.json({ ok: true, result: updates });
      }
      case "sendMessage": {
        const chatId = Number(params.chat_id);
        const text = params.parse_mode === "HTML" ? renderHtml(params.text) : params.text;
        if (text === null) {
          return c.json({ ok: false, description: "Bad Request: can't parse entities" }, 400);
        }
        sent.push({ chatId, text });
        onSent?.(chatId, text);
        return c.json({ ok: true, result: { message_id: nextMessageId++ } });
      }
      default:
        return c.json({ ok: false, description: "Not Found" }, 404);
    }
  });

  const server = await new Promise<ReturnType<typeof serve>>((resolve) => {
    const started = serve({ fetch: app.fetch, hostname: "127.0.0.1", port }, () =>
      resolve(started),
    );
  });
  const { port: actualPort } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${actualPort}`,
    send: (from, text, date = new Date()) =>
      push({
        date: Math.floor(date.getTime() / 1000),
        text,
        chat: { id: from.id, type: "private" },
        from: { id: from.id, first_name: from.firstName, username: from.username },
      }),
    sendUpdate: push,
    sentTo: (chatId) => sent.filter((message) => message.chatId === chatId).map((m) => m.text),
    stall: (method) => {
      const arrived = new Promise<void>((resolve) => stalled.set(method, resolve));
      return { arrived, resume: () => stalled.delete(method) };
    },
    close: async () => {
      closed();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}

// Теги, которыми пишет бот; Telegram знает и другие, подделке они пока не нужны.
const TAG = /<\/?(?:b|i|u|s|code|pre)>/g;
const ENTITY = /&(?:lt|gt|amp|quot|#\d+|#x[\da-fA-F]+);/g;

/**
 * Текст с `parse_mode: "HTML"`, как его покажет Telegram: без тегов и с раскрытыми сущностями.
 * `<`, `>` и `&` вне тега и сущности Telegram не принимает, тогда – `null`.
 */
function renderHtml(html: string) {
  const text = html.replaceAll(TAG, "");
  if (/[<>]/.test(text) || text.replaceAll(ENTITY, "").includes("&")) return null;
  return text.replaceAll(ENTITY, (entity) => decodeEntity(entity.slice(1, -1)));
}

function decodeEntity(name: string) {
  switch (name) {
    case "lt":
      return "<";
    case "gt":
      return ">";
    case "amp":
      return "&";
    case "quot":
      return '"';
    default:
      return String.fromCodePoint(
        name.startsWith("#x") ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1)),
      );
  }
}
