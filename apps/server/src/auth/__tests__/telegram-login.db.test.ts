import type { TelegramLoginEvents, TelegramPerson } from "../telegram-login.ts";
import type pg from "pg";

import { randomInt } from "node:crypto";
import { beforeAll, expect, test, vi } from "vitest";

import { TEST_AUTH_CONFIG as config } from "../../__tests__/test-config.ts";
import { createTestDatabase } from "../../__tests__/test-database.ts";
import { createApp } from "../../http/app.ts";
import { createAuth } from "../auth.ts";
import { issueTelegramCode } from "../telegram-login.ts";

const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

// Случайность – внешняя граница, как время: тест совпадения кодов задаёт её сам, остальные идут
// на настоящей.
vi.mock("node:crypto", async (importOriginal) => {
  const crypto = await importOriginal<typeof import("node:crypto")>();
  return { ...crypto, randomInt: vi.fn<(min: number, max: number) => number>(crypto.randomInt) };
});

let pool: pg.Pool;

beforeAll(async () => {
  const database = await createTestDatabase();
  pool = database.pool;
  return database.drop;
});

// Пределы считаются по IP в базе файла: у каждого теста свои адреса и свои люди.
let lastIp = 0;
function nextIp() {
  lastIp += 1;
  return `198.51.${Math.floor(lastIp / 250)}.${lastIp % 250}`;
}

let lastTelegramId = 5_000_000_000;
function newPerson(profile: Partial<TelegramPerson> = {}): TelegramPerson {
  lastTelegramId += 1;
  return { telegramId: String(lastTelegramId), name: "Анна", username: "anna", ...profile };
}

/** Сервер с плагином входа на базе файла; оповещения бота записываются. */
function startServer() {
  const events = {
    signedIn: vi.fn<TelegramLoginEvents["signedIn"]>(async () => {}),
    manyWrongCodes: vi.fn<TelegramLoginEvents["manyWrongCodes"]>(async () => {}),
  };
  const auth = createAuth({ pool, config, events });
  const app = createApp({ auth, pool });
  let lastMessageId = 0;

  return {
    app,
    events,
    /** Бот выдаёт код на новое сообщение `/start`. */
    issue: async (person: TelegramPerson, messageId = ++lastMessageId) => {
      const code = await issueTelegramCode(await auth.$context, { person, messageId });
      if (code === null) throw new Error("Код не выдан");
      return code;
    },
    reissue: async (person: TelegramPerson, messageId: number) =>
      issueTelegramCode(await auth.$context, { person, messageId }),
    signIn: (code: unknown, { ip = nextIp(), headers = {} } = {}) =>
      app.request("/api/auth/sign-in/telegram-code", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: config.publicUrl,
          "x-real-ip": ip,
          ...headers,
        },
        body: JSON.stringify({ code }),
      }),
  };
}

/** Ответ на удачный вход. */
interface SignedIn {
  user: { id: string; name: string };
}

function sessionCookie(response: Response) {
  const cookie = response.headers
    .getSetCookie()
    .find((header) => header.startsWith("__Host-lists.session_token="));
  if (!cookie) throw new Error("Нет cookie сессии");
  return cookie;
}

async function expectWrongCode(response: Response) {
  expect(response.status).toBe(400);
  expect(await response.json()).toMatchObject({ code: "WRONG_CODE" });
}

test("новый человек входит кодом из бота: аккаунт Telegram, сессия в cookie __Host-lists, оповещение", async () => {
  const server = startServer();
  const anna = newPerson();

  const response = await server.signIn(await server.issue(anna), {
    headers: { "user-agent": SAFARI_IPHONE },
  });

  expect(response.status).toBe(200);
  const { user } = (await response.json()) as SignedIn;
  expect(user.name).toBe("Анна");
  const cookie = sessionCookie(response);
  expect(cookie).toMatch(/; Secure/);
  expect(cookie).toMatch(/; HttpOnly/);
  expect(cookie).toMatch(/; Path=\//);

  const session = await server.app.request("/api/auth/get-session", {
    headers: { cookie: cookie.split(";")[0] ?? "" },
  });
  expect(((await session.json()) as { user: unknown }).user).toMatchObject({
    id: user.id,
    name: "Анна",
    email: `tg-${anna.telegramId}@telegram.invalid`,
    telegramUsername: "anna",
  });
  const accounts = await pool.query(
    'SELECT "providerId", "accountId" FROM auth.account WHERE "userId" = $1',
    [user.id],
  );
  expect(accounts.rows).toEqual([{ providerId: "telegram", accountId: anna.telegramId }]);
  expect(server.events.signedIn).toHaveBeenCalledWith({
    telegramId: anna.telegramId,
    userAgent: SAFARI_IPHONE,
    at: expect.any(Date),
  });
});

test("прежний человек входит в тот же аккаунт, имя и username – из последнего /start", async () => {
  const server = startServer();
  const boris = newPerson({ name: "Борис", username: "boris" });
  const first = (await (await server.signIn(await server.issue(boris))).json()) as SignedIn;

  const renamed = { ...boris, name: "Борис Б.", username: null };
  const second = (await (await server.signIn(await server.issue(renamed))).json()) as SignedIn;

  expect(second.user.id).toBe(first.user.id);
  const users = await pool.query('SELECT name, "telegramUsername" FROM auth."user" WHERE id = $1', [
    first.user.id,
  ]);
  expect(users.rows).toEqual([{ name: "Борис Б.", telegramUsername: null }]);
});

test("код принимается с пробелами и дефисами", async () => {
  const server = startServer();
  const spaced = await server.issue(newPerson());
  const dashed = await server.issue(newPerson());

  const responses = [
    await server.signIn(` ${spaced.slice(0, 4)} ${spaced.slice(4)} `),
    await server.signIn(`${dashed.slice(0, 4)}-${dashed.slice(4)}`),
  ];

  expect(responses.map((response) => response.status)).toEqual([200, 200]);
});

test("неизвестный, просроченный, использованный и не похожий на код – один ответ", async () => {
  const server = startServer();
  // Разные люди: новый код того же человека погасил бы прежний и без входа.
  const used = await server.issue(newPerson());
  expect((await server.signIn(used)).status).toBe(200);
  const late = newPerson();
  const expired = await server.issue(late);
  await pool.query(
    `UPDATE auth."telegramCode" SET "expiresAt" = now() - interval '1 second' WHERE "telegramId" = $1`,
    [late.telegramId],
  );

  for (const code of [used, expired, "00000000", "1234567", "abcdefgh", 12345678, undefined]) {
    await expectWrongCode(await server.signIn(code));
  }
});

test("новый код заменяет прежний, а повтор того же /start кода не меняет", async () => {
  const server = startServer();
  const person = newPerson();
  const replaced = await server.issue(person, 1);
  const current = await server.issue(person, 2);

  expect(await server.reissue(person, 2)).toBeNull();
  await expectWrongCode(await server.signIn(replaced));
  expect((await server.signIn(current)).status).toBe(200);
});

test("в базе лежит не код, а его HMAC; просроченные коды удаляет следующая выдача", async () => {
  const server = startServer();
  const late = newPerson();
  await server.issue(late);
  await pool.query(
    `UPDATE auth."telegramCode" SET "expiresAt" = now() - interval '1 second' WHERE "telegramId" = $1`,
    [late.telegramId],
  );

  const fresh = newPerson();
  const code = await server.issue(fresh);

  const rows = await pool.query(
    'SELECT * FROM auth."telegramCode" WHERE "telegramId" IN ($1, $2)',
    [late.telegramId, fresh.telegramId],
  );
  expect(rows.rows.map((row) => row.telegramId)).toEqual([fresh.telegramId]);
  expect(JSON.stringify(rows.rows)).not.toContain(code);
});

test("код, совпавший с живым кодом другого человека, выдаётся заново", async () => {
  const server = startServer();
  const anna = newPerson();
  const boris = newPerson({ name: "Борис" });
  const draws = vi.mocked(randomInt as (min: number, max: number) => number);
  draws.mockReturnValueOnce(12_345_678).mockReturnValueOnce(12_345_678).mockReturnValueOnce(1_234);

  expect(await server.issue(anna)).toBe("12345678");
  expect(await server.issue(boris)).toBe("00001234");

  const signedIn = (await (await server.signIn("12345678")).json()) as SignedIn;
  expect(signedIn.user.name).toBe("Анна");
});

test("из двух одновременных входов одним кодом проходит один", async () => {
  const server = startServer();
  const code = await server.issue(newPerson());

  const responses = await Promise.all([server.signIn(code), server.signIn(code)]);

  expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
});

test("с одного IP – 20 попыток подряд, удачные тоже в счёт; другой IP не задет", async () => {
  const server = startServer();
  const ip = nextIp();
  expect((await server.signIn(await server.issue(newPerson()), { ip })).status).toBe(200);
  for (let attempt = 0; attempt < 19; attempt += 1) {
    await expectWrongCode(await server.signIn("00000000", { ip }));
  }
  const code = await server.issue(newPerson());

  expect((await server.signIn(code, { ip })).status).toBe(429);
  expect((await server.signIn(code)).status).toBe(200);
});

test("больше 100 неверных кодов за час со всех IP – одно оповещение владельцу, через час – снова", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  try {
    const server = startServer();

    for (let attempt = 1; attempt <= 102; attempt += 1) {
      await server.signIn("00000000");
      expect(server.events.manyWrongCodes).toHaveBeenCalledTimes(attempt > 100 ? 1 : 0);
    }
    vi.setSystemTime(Date.now() + 60 * 60 * 1000);
    for (let attempt = 1; attempt <= 101; attempt += 1) {
      await server.signIn("00000000");
    }

    expect(server.events.manyWrongCodes.mock.calls).toEqual([
      [{ failures: 101 }],
      [{ failures: 101 }],
    ]);
  } finally {
    vi.useRealTimers();
  }
});

test("вход с чужого сайта отклонён и без cookie", async () => {
  const server = startServer();
  const code = await server.issue(newPerson());

  const foreign = await server.signIn(code, { headers: { origin: "https://evil.example" } });
  const navigation = await server.signIn(code, {
    headers: { origin: "", "sec-fetch-site": "cross-site", "sec-fetch-mode": "navigate" },
  });

  expect(foreign.status).toBe(403);
  expect(navigation.status).toBe(403);
  expect((await server.signIn(code)).status).toBe(200);
});

test("сбой оповещения о входе вход не отменяет", async () => {
  const server = startServer();
  server.events.signedIn.mockRejectedValue(new Error("Telegram недоступен"));
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  try {
    const response = await server.signIn(await server.issue(newPerson()));

    expect(response.status).toBe(200);
    await vi.waitFor(() =>
      expect(errors).toHaveBeenCalledWith(
        "Бот не отправил оповещение о входе:",
        new Error("Telegram недоступен"),
      ),
    );
  } finally {
    errors.mockRestore();
  }
});
