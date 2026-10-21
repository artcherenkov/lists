import type { Auth } from "../../auth/auth.ts";
import type { App } from "../../http/app.ts";
import type { BotTiming } from "../bot.ts";
import type { FakeBotApi, FakeUser } from "../fake-bot-api.ts";
import type pg from "pg";

import { afterEach, beforeAll, expect, test, vi } from "vitest";

import { IGNORED_EVENTS, TEST_AUTH_CONFIG as config } from "../../__tests__/test-config.ts";
import { createTestDatabase } from "../../__tests__/test-database.ts";
import { createAuth } from "../../auth/auth.ts";
import { issueTelegramCode } from "../../auth/telegram-login.ts";
import { createApp } from "../../http/app.ts";
import { createBotApi } from "../bot-api.ts";
import { type Bot, startBot } from "../bot.ts";
import { startFakeBotApi } from "../fake-bot-api.ts";

const TOKEN = "test-token";
// Сроки в сотни раз короче боевых: зависший запрос обрывается за доли секунды.
const TIMING: BotTiming = { pollSeconds: 1, responseGraceMs: 300, retryMs: 50 };
const SLOW = { timeout: 5000 };

let pool: pg.Pool;
let auth: Auth;
let app: App;

beforeAll(async () => {
  const database = await createTestDatabase();
  pool = database.pool;
  auth = createAuth({ pool, config, events: IGNORED_EVENTS });
  app = createApp({ auth, pool });
  return database.drop;
});

// Коды выдаёт настоящий плагин на базе файла: у каждого теста свои люди.
let lastTelegramId = 7_000_000_000;
function newUser(firstName = "Анна"): FakeUser {
  lastTelegramId += 1;
  return { id: lastTelegramId, firstName };
}

let fake: FakeBotApi;
const bots: Bot[] = [];

afterEach(async () => {
  await Promise.all(bots.splice(0).map((bot) => bot.stop()));
  await fake.close();
});

async function startFakeTelegram() {
  fake = await startFakeBotApi({ token: TOKEN });
}

/** Бот сервера: тот же, что в `main.ts`, на подделке Telegram. */
async function startTestBot(timing = TIMING) {
  const context = await auth.$context;
  const bot = startBot({
    api: createBotApi({ apiUrl: fake.url, token: TOKEN }),
    issueCode: (request) => issueTelegramCode(context, request),
    siteHost: "lists.example",
    timing,
  });
  bots.push(bot);
  return bot;
}

async function waitForAnswers(user: FakeUser, count: number) {
  await vi.waitFor(() => expect(fake.sentTo(user.id)).toHaveLength(count), SLOW);
  return fake.sentTo(user.id);
}

function codeIn(message: string | undefined) {
  const code = message?.match(/^Код для входа в Lists: (\d{8})$/m)?.[1];
  if (!code) throw new Error(`В сообщении нет кода: ${message}`);
  return code;
}

function signIn(code: string) {
  return app.request("/api/auth/sign-in/telegram-code", {
    method: "POST",
    headers: { "content-type": "application/json", origin: config.publicUrl },
    body: JSON.stringify({ code }),
  });
}

async function liveCodes(user: FakeUser) {
  const codes = await pool.query('SELECT 1 FROM auth."telegramCode" WHERE "telegramId" = $1', [
    String(user.id),
  ]);
  return codes.rowCount;
}

function silenceErrors() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

test("на /start бот присылает код с адресом сайта, и им входят в аккаунт с именем из Telegram", async () => {
  await startFakeTelegram();
  await startTestBot();
  const anna = newUser();

  fake.sendUpdate({
    date: Math.floor(Date.now() / 1000),
    text: "/start",
    chat: { id: anna.id, type: "private" },
    from: { id: anna.id, first_name: "Анна", last_name: "Б.", username: "anna" },
  });
  const [message] = await waitForAnswers(anna, 1);

  expect(message).toContain("Введите его на lists.example в течение 5 минут.");
  const response = await signIn(codeIn(message));
  expect(response.status).toBe(200);
  const users = await pool.query(
    `SELECT u.name, u."telegramUsername" FROM auth."user" u
     JOIN auth.account a ON a."userId" = u.id
     WHERE a."providerId" = 'telegram' AND a."accountId" = $1`,
    [String(anna.id)],
  );
  expect(users.rows).toEqual([{ name: "Анна Б.", telegramUsername: "anna" }]);
});

test("/start login из ссылки экрана входа и /start@бот тоже дают код", async () => {
  await startFakeTelegram();
  await startTestBot();
  const anna = newUser();

  fake.send(anna, "/start login");
  fake.send(anna, "/start@lists_bot");
  const messages = await waitForAnswers(anna, 2);

  expect(messages.map(codeIn)).toHaveLength(2);
});

test("не /start, группа, чужой чат и /start старше срока кода остаются без кода", async () => {
  await startFakeTelegram();
  await startTestBot();
  const anna = newUser();
  const boris = newUser("Борис");
  const now = Math.floor(Date.now() / 1000);
  const from = { id: anna.id, first_name: anna.firstName };

  fake.send(anna, "привет");
  fake.send(anna, "/starter");
  fake.send(anna, "start");
  fake.send(anna, "/start", new Date(Date.now() - 6 * 60 * 1000));
  fake.sendUpdate({ date: now, chat: { id: anna.id, type: "private" }, from });
  fake.sendUpdate({ date: now, text: "/start", chat: { id: -500, type: "group" }, from });
  fake.sendUpdate({ date: now, text: "/start", chat: { id: boris.id, type: "private" }, from });
  fake.sendUpdate({ date: now, text: "/start", chat: { id: anna.id, type: "private" } });
  // Бот отвечает по порядку: ответ Борису значит, что всё до него уже разобрано.
  fake.send(boris, "/start");
  await waitForAnswers(boris, 1);

  expect(fake.sentTo(anna.id)).toEqual([]);
  expect(fake.sentTo(-500)).toEqual([]);
});

test("повторно доставленный /start остаётся без ответа, и прежний код действует", async () => {
  await startFakeTelegram();
  await startTestBot();
  const anna = newUser();
  const start = {
    message_id: 42,
    date: Math.floor(Date.now() / 1000),
    text: "/start",
    chat: { id: anna.id, type: "private" },
    from: { id: anna.id, first_name: anna.firstName },
  };

  fake.sendUpdate(start);
  fake.sendUpdate(start);
  const boris = newUser("Борис");
  fake.send(boris, "/start");
  await waitForAnswers(boris, 1);

  const messages = fake.sentTo(anna.id);
  expect(messages).toHaveLength(1);
  expect((await signIn(codeIn(messages[0]))).status).toBe(200);
});

test("остановка посреди ответа подтверждает разобранное: после перезапуска оно не приходит заново", async () => {
  await startFakeTelegram();
  const first = await startTestBot();
  const anna = newUser();
  const errors = silenceErrors();
  try {
    // Отправка кода висит, пока сервер останавливается: бот ещё разбирает пачку.
    const resume = fake.stall("sendMessage");
    fake.send(anna, "/start");
    await vi.waitFor(async () => expect(await liveCodes(anna)).toBe(1), SLOW);
    await first.stop();
    resume();
  } finally {
    errors.mockRestore();
  }
  // Код погашен, как после входа: повтор того же `/start` выдал бы новый.
  await pool.query('DELETE FROM auth."telegramCode" WHERE "telegramId" = $1', [String(anna.id)]);

  await startTestBot();
  const boris = newUser("Борис");
  fake.send(boris, "/start");
  await waitForAnswers(boris, 1);

  expect(fake.sentTo(anna.id)).toEqual([]);
});

test("зависший опрос обрывается по сроку, и бот снова получает сообщения", async () => {
  await startFakeTelegram();
  const errors = silenceErrors();
  try {
    const resume = fake.stall("getUpdates");
    await startTestBot();
    await vi.waitFor(
      () =>
        expect(errors).toHaveBeenCalledWith(
          "Бот не получил сообщения из Telegram:",
          expect.objectContaining({ name: "TimeoutError" }),
        ),
      SLOW,
    );

    resume();
    const anna = newUser();
    fake.send(anna, "/start");
    await waitForAnswers(anna, 1);
  } finally {
    errors.mockRestore();
  }
});

test("зависшая отправка обрывается по сроку и не держит ответы другим", async () => {
  await startFakeTelegram();
  await startTestBot();
  const errors = silenceErrors();
  try {
    const resume = fake.stall("sendMessage");
    fake.send(newUser(), "/start");
    await vi.waitFor(
      () =>
        expect(errors).toHaveBeenCalledWith(
          expect.stringMatching(/^Бот не ответил на сообщение \d+:$/),
          expect.objectContaining({ name: "TimeoutError" }),
        ),
      SLOW,
    );

    resume();
    const boris = newUser("Борис");
    fake.send(boris, "/start");
    await waitForAnswers(boris, 1);
  } finally {
    errors.mockRestore();
  }
});

test("остановка обрывает долгий опрос, а не ждёт его срока", async () => {
  await startFakeTelegram();
  // Опрос длиннее срока теста: остановка, которая ждёт его конца, не уложится и в срок теста.
  const bot = await startTestBot({ ...TIMING, pollSeconds: 60 });
  const anna = newUser();
  fake.send(anna, "/start");
  await waitForAnswers(anna, 1);

  const started = performance.now();
  await bot.stop();

  expect(performance.now() - started).toBeLessThan(1000);
});
