import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { watchBotUsername } from "../bot-username.ts";

const RETRY_MS = 5000;

/** Сервер, ответами которого управляет тест: `answer` отвечает на последний запрос. */
function fakeServer() {
  const pending: Array<(username: string | null) => void> = [];
  return {
    load: () => new Promise<string | null>((resolve) => pending.push(resolve)),
    requests: () => pending.length,
    answer: async (username: string | null) => {
      pending.at(-1)?.(username);
      await vi.advanceTimersByTimeAsync(0);
    },
  };
}

function watch(server: ReturnType<typeof fakeServer>) {
  const seen: string[] = [];
  const stop = watchBotUsername({
    load: server.load,
    retryMs: RETRY_MS,
    onName: (username) => seen.push(username),
    onUnavailable: () => seen.push("недоступен"),
  });
  return { seen, stop };
}

describe("имя бота входа", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("имя пришло – запросов больше нет", async () => {
    const server = fakeServer();
    const { seen } = watch(server);

    await server.answer("lists_bot");
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);

    expect(seen).toEqual(["lists_bot"]);
    expect(server.requests()).toBe(1);
  });

  test("сервер не ответил – новый запрос через 5 с, а не раньше", async () => {
    const server = fakeServer();
    const { seen } = watch(server);

    await server.answer(null);
    await vi.advanceTimersByTimeAsync(RETRY_MS - 1);
    expect(server.requests()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(server.requests()).toBe(2);
    await server.answer("lists_bot");

    expect(seen).toEqual(["недоступен", "lists_bot"]);
  });

  test("остановка во время запроса – ответ ничего не меняет и повтора нет", async () => {
    const server = fakeServer();
    const { seen, stop } = watch(server);

    stop();
    await server.answer(null);
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);

    expect(seen).toEqual([]);
    expect(server.requests()).toBe(1);
  });

  test("остановка во время ожидания повтора – запросов больше нет", async () => {
    const server = fakeServer();
    const { stop } = watch(server);
    await server.answer(null);

    stop();
    await vi.advanceTimersByTimeAsync(RETRY_MS * 3);

    expect(server.requests()).toBe(1);
  });
});
