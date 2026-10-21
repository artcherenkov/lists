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
  /** Что бот прислал в чат, по порядку. */
  sentTo(chatId: number): string[];
  /**
   * Запросы метода остаются без ответа, как через зависший прокси, пока не вызвана возвращённая
   * функция; уже зависшие ответа не получат.
   */
  stall(method: "getUpdates" | "sendMessage"): () => void;
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
  /** Бот прислал сообщение: в разработке его печатает консоль. */
  onSent?: (chatId: number, text: string) => void;
}): Promise<FakeBotApi> {
  const updates: Update[] = [];
  const sent: { chatId: number; text: string }[] = [];
  const waiting = new Set<() => void>();
  const stalled = new Set<string>();
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
    });
  }

  const app = new Hono();
  app.post("/:bot/:method", async (c) => {
    if (c.req.param("bot") !== `bot${token}`) {
      return c.json({ ok: false, description: "Unauthorized" }, 401);
    }
    const params = await c.req.json();
    const method = c.req.param("method");
    if (stalled.has(method)) {
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
        sent.push({ chatId, text: params.text });
        onSent?.(chatId, params.text);
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
      stalled.add(method);
      return () => stalled.delete(method);
    },
    close: async () => {
      // Опрос бота и зависшие запросы отвечают сразу, иначе сервер ждал бы конца их срока.
      for (const wake of waiting) wake();
      closed();
      await new Promise((resolve) => server.close(resolve));
    },
  };
}
