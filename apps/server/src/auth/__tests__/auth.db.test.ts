import type { Auth } from "../auth.ts";
import type pg from "pg";

import { beforeAll, describe, expect, test } from "vitest";

import { TEST_AUTH_CONFIG as config } from "../../__tests__/test-config.ts";
import { createTestDatabase } from "../../__tests__/test-database.ts";
import { checkAuthSchema, createAuth } from "../auth.ts";

describe("вход на базе с миграциями", () => {
  let pool: pg.Pool;
  let auth: Auth;

  beforeAll(async () => {
    const database = await createTestDatabase();
    pool = database.pool;
    auth = createAuth({ pool, config });
    return database.drop;
  });

  test("таблицы из наших миграций совпадают с теми, что ждёт better-auth", async () => {
    await expect(checkAuthSchema(auth)).resolves.toBeUndefined();
  });

  test("вход хранится в cookie __Host-lists на год", async () => {
    // На https better-auth по умолчанию дописал бы к имени `__Secure-`, поэтому адрес – как в бою.
    const production = createAuth({
      pool,
      config: { ...config, publicUrl: "https://lists.example" },
    });
    const context = await production.$context;

    // Secure better-auth дописывает по имени `__Host-`, когда отдаёт cookie, а не в настройках.
    expect(context.authCookies.sessionToken.name).toBe("__Host-lists.session_token");
    expect(context.sessionConfig.expiresIn).toBe(365 * 24 * 60 * 60);
  });

  test("запись входа идёт транзакцией: при ошибке не остаётся ничего", async () => {
    const { adapter, internalAdapter } = await auth.$context;
    const email = "tg-44@telegram.invalid";

    await expect(
      adapter.transaction(async (transaction) => {
        await transaction.create({
          model: "user",
          data: { name: "В", email, emailVerified: false },
        });
        throw new Error("сбой после создания человека");
      }),
    ).rejects.toThrow("сбой после создания человека");
    expect(await internalAdapter.findUserByEmail(email)).toBeNull();
  });

  test("один аккаунт Telegram не привязать к двум людям", async () => {
    const { internalAdapter } = await auth.$context;
    const source = { method: "telegram" };
    const first = await internalAdapter.createUser(
      { name: "А", email: "tg-42@telegram.invalid" },
      source,
    );
    const second = await internalAdapter.createUser(
      { name: "Б", email: "tg-43@telegram.invalid" },
      source,
    );
    const telegram = { providerId: "telegram", accountId: "42" };

    await internalAdapter.createAccount({ ...telegram, userId: first.id });
    await expect(internalAdapter.createAccount({ ...telegram, userId: second.id })).rejects.toThrow(
      "account_providerId_accountId_uidx",
    );
  });
});

describe("запуск сервера", () => {
  test("на базе без таблиц входа сверка схемы отказывает", async () => {
    const database = await createTestDatabase({ migrated: false });
    try {
      const auth = createAuth({ pool: database.pool, config });

      await expect(checkAuthSchema(auth)).rejects.toThrow("Database schema mismatch");
    } finally {
      await database.drop();
    }
  });
});
