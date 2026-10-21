import type { AuthConfig } from "../auth/auth.ts";
import type { TelegramLoginEvents } from "../auth/telegram-login.ts";

/** Настройки входа в тестах; базу каждый тест берёт свою из `createTestDatabase`. */
export const TEST_AUTH_CONFIG: AuthConfig = {
  publicUrl: "http://localhost:5175",
  authSecret: "test-secret-0123456789-0123456789-0123456789",
};

/** Имя бота входа в тестах. */
export const TEST_BOT_USERNAME = "lists_test_bot";

/** Оповещения входа, которые никуда не уходят; тест, которому они важны, подставляет свои. */
export const IGNORED_EVENTS: TelegramLoginEvents = {
  signedIn: async () => {},
  manyWrongCodes: async () => {},
};
