import type { KeyValueStorage } from "../../storage/storage.ts";

import { describe, expect, test } from "vitest";

import { memoryStorage } from "../../storage/__tests__/fake-storage.ts";
import { ACCOUNT_KEY, createSessionStore } from "../store.ts";

const ANNA = { id: "user-1", name: "Анна" };
const SAVED_ANNA = { [ACCOUNT_KEY]: JSON.stringify(ANNA) };

const SESSION_PATH = "/api/auth/get-session";
const SIGN_IN_PATH = "/api/auth/sign-in/telegram-code";
const SIGN_OUT_PATH = "/api/auth/sign-out";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

/** Ответ better-auth о сессии: сессия и пользователь со всеми его полями. */
function sessionOf(account: { id: string; name: string }) {
  return json({
    session: { id: "session-1", userId: account.id, expiresAt: "2027-10-21T00:00:00.000Z" },
    user: { ...account, email: "tg-1@telegram.invalid", telegramUsername: null },
  });
}

const noConnection = () => Promise.reject(new TypeError("Failed to fetch"));

type Route = () => Response | Promise<Response>;

/** Сервер – внешняя граница: ответ на каждый путь задаёт тест, остальные пути без связи. */
function startStore({
  storage = memoryStorage(),
  routes,
}: {
  storage?: KeyValueStorage;
  routes: Record<string, Route>;
}) {
  const log: string[] = [];
  const fetch = (async (input: RequestInfo | URL) => {
    const route = routes[String(input)];
    return route ? route() : noConnection();
  }) as typeof globalThis.fetch;
  const store = createSessionStore({ storage, fetch, log: (text) => log.push(text) });
  return { store, log };
}

/** Ответ, который приходит, когда его отпустит тест. */
function heldResponse(response: () => Response) {
  let release = () => {};
  const arrived = new Promise<Response>((resolve) => {
    release = () => resolve(response());
  });
  return { route: () => arrived, release };
}

describe("запуск", () => {
  test("вошедший на устройстве открывается вошедшим до ответа сервера, сервер вход подтверждает", async () => {
    const { store, log } = startStore({
      storage: memoryStorage(SAVED_ANNA),
      routes: { [SESSION_PATH]: () => sessionOf(ANNA) },
    });
    expect(store.account()).toEqual(ANNA);

    await store.check();

    expect(store.account()).toEqual(ANNA);
    expect(log).toEqual([]);
  });

  test("сервер не помнит сессию – никто не вошёл, запись на устройстве удалена", async () => {
    const storage = memoryStorage(SAVED_ANNA);
    const { store, log } = startStore({ storage, routes: { [SESSION_PATH]: () => json(null) } });

    await store.check();

    expect(store.account()).toBeNull();
    expect(storage.data.has(ACCOUNT_KEY)).toBe(false);
    expect(log).toEqual(["Сервер не помнит вход этого устройства: показан экран входа"]);
  });

  test("записи на устройстве нет, а сервер помнит сессию – вход восстановлен", async () => {
    const storage = memoryStorage();
    const { store, log } = startStore({
      storage,
      routes: { [SESSION_PATH]: () => sessionOf(ANNA) },
    });
    expect(store.account()).toBeNull();

    await store.check();

    expect(store.account()).toEqual(ANNA);
    expect(storage.data.get(ACCOUNT_KEY)).toBe(JSON.stringify(ANNA));
    expect(log).toEqual(["Вход восстановлен: сервер помнит сессию этого устройства"]);
  });

  test.each([
    ["нет связи", noConnection],
    ["ошибка сервера", () => json({ message: "Internal Server Error" }, 500)],
    ["страница вместо ответа API", () => new Response("<!doctype html><html></html>")],
    ["JSON без пользователя", () => json({ ok: true })],
  ])("без ответа о сессии вход остаётся: %s", async (_case, route) => {
    const { store, log } = startStore({
      storage: memoryStorage(SAVED_ANNA),
      routes: { [SESSION_PATH]: route },
    });

    await store.check();

    expect(store.account()).toEqual(ANNA);
    expect(log).toEqual([]);
  });

  test("повреждённая запись на устройстве – никто не вошёл", () => {
    for (const saved of ["{", '"Анна"', JSON.stringify({ id: 1, name: "Анна" })]) {
      const { store } = startStore({
        storage: memoryStorage({ [ACCOUNT_KEY]: saved }),
        routes: {},
      });

      expect(store.account()).toBeNull();
    }
  });
});

describe("вход кодом", () => {
  test("аккаунт сохраняется на устройстве, перезапуск открывается вошедшим, журнал без имени", async () => {
    const storage = memoryStorage();
    const { store, log } = startStore({
      storage,
      routes: { [SIGN_IN_PATH]: () => sessionOf(ANNA) },
    });
    let notified = 0;
    store.subscribe(() => (notified += 1));

    const result = await store.signIn("12345678");

    expect(result).toEqual({ kind: "signed-in", account: ANNA });
    expect(store.account()).toEqual(ANNA);
    expect(notified).toBe(1);
    expect(log).toEqual(["Вход кодом из Telegram"]);
    const restarted = startStore({ storage, routes: {} });
    expect(restarted.store.account()).toEqual(ANNA);
  });

  test.each([
    [
      "неверный код",
      () => json({ code: "WRONG_CODE", message: "Неверный код" }, 400),
      { kind: "wrong-code" },
      "Вход не удался: неверный код",
    ],
    [
      "слишком часто, сервер назвал срок",
      () => json({ message: "Too many requests" }, 429, { "X-Retry-After": "1800" }),
      { kind: "too-often", retryAfterSeconds: 1800 },
      "Вход не удался: слишком много попыток",
    ],
    [
      "слишком часто без срока",
      () => json({ message: "Too many requests" }, 429),
      { kind: "too-often", retryAfterSeconds: null },
      "Вход не удался: слишком много попыток",
    ],
    ["нет связи", noConnection, { kind: "no-connection" }, "Вход не удался: нет связи с сервером"],
    [
      "ошибка сервера",
      () => json({ message: "Internal Server Error" }, 500),
      { kind: "server-error" },
      "Вход не удался: ошибка сервера",
    ],
    [
      "отказ с другим кодом",
      () => json({ code: "FORBIDDEN", message: "Invalid origin" }, 403),
      { kind: "server-error" },
      "Вход не удался: ошибка сервера",
    ],
  ])("не впустили – %s: аккаунта нет, причина в журнале", async (_case, route, expected, line) => {
    const { store, log } = startStore({ routes: { [SIGN_IN_PATH]: route } });

    expect(await store.signIn("12345678")).toEqual(expected);
    expect(store.account()).toBeNull();
    expect(log).toEqual([line]);
  });

  test("ответ на вход потерялся, а сервер впустил – вход восстанавливает сверка", async () => {
    const { store, log } = startStore({
      routes: {
        [SIGN_IN_PATH]: () => json({ message: "Internal Server Error" }, 500),
        [SESSION_PATH]: () => sessionOf(ANNA),
      },
    });

    expect(await store.signIn("12345678")).toEqual({ kind: "server-error" });
    expect(store.account()).toEqual(ANNA);
    expect(log).toEqual([
      "Вход не удался: ошибка сервера",
      "Вход восстановлен: сервер помнит сессию этого устройства",
    ]);
  });

  test("ответ о сессии, запрошенный до входа, вход не отменяет", async () => {
    const session = heldResponse(() => json(null));
    const { store } = startStore({
      routes: { [SESSION_PATH]: session.route, [SIGN_IN_PATH]: () => sessionOf(ANNA) },
    });

    const checking = store.check();
    await store.signIn("12345678");
    session.release();
    await checking;

    expect(store.account()).toEqual(ANNA);
  });
});

describe("выход", () => {
  test("сервер забыл сессию – устройство тоже", async () => {
    const storage = memoryStorage(SAVED_ANNA);
    const { store, log } = startStore({
      storage,
      routes: { [SIGN_OUT_PATH]: () => json({ success: true }) },
    });

    expect(await store.signOut()).toBe(true);
    expect(store.account()).toBeNull();
    expect(storage.data.has(ACCOUNT_KEY)).toBe(false);
    expect(log).toEqual(["Выход из аккаунта"]);
  });

  test.each([
    ["нет связи", noConnection],
    ["ошибка сервера", () => json({ message: "Internal Server Error" }, 500)],
  ])("без ответа сервера – человек остаётся вошедшим: %s", async (_case, route) => {
    const { store, log } = startStore({
      storage: memoryStorage(SAVED_ANNA),
      routes: { [SIGN_OUT_PATH]: route },
    });

    expect(await store.signOut()).toBe(false);
    expect(store.account()).toEqual(ANNA);
    expect(log).toEqual(["Выход не удался: нет ответа сервера"]);
  });

  test("ответ о сессии, запрошенный до выхода, вход не возвращает", async () => {
    const session = heldResponse(() => sessionOf(ANNA));
    const { store } = startStore({
      storage: memoryStorage(SAVED_ANNA),
      routes: { [SESSION_PATH]: session.route, [SIGN_OUT_PATH]: () => json({ success: true }) },
    });

    const checking = store.check();
    await store.signOut();
    session.release();
    await checking;

    expect(store.account()).toBeNull();
  });
});

describe("другая вкладка", () => {
  test("вошла – вход берётся из общего хранилища", async () => {
    const storage = memoryStorage();
    const other = startStore({ storage, routes: { [SIGN_IN_PATH]: () => sessionOf(ANNA) } });
    const { store, log } = startStore({ storage, routes: {} });
    let notified = 0;
    store.subscribe(() => (notified += 1));

    await other.store.signIn("12345678");
    store.reloadFromStorage();

    expect(store.account()).toEqual(ANNA);
    expect(notified).toBe(1);
    expect(log).toEqual([]);
  });

  test("вышла – и здесь никто не вошёл, даже если ответ о сессии, запрошенный раньше, пришёл позже", async () => {
    const storage = memoryStorage(SAVED_ANNA);
    const other = startStore({
      storage,
      routes: { [SIGN_OUT_PATH]: () => json({ success: true }) },
    });
    const session = heldResponse(() => sessionOf(ANNA));
    const { store } = startStore({ storage, routes: { [SESSION_PATH]: session.route } });

    const checking = store.check();
    await other.store.signOut();
    store.reloadFromStorage();
    session.release();
    await checking;

    expect(store.account()).toBeNull();
  });
});
