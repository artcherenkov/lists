import type { ServerConfig } from "../config.ts";

/** Настройки сервера в тестах; базу каждый тест берёт свою из `createTestDatabase`. */
export const TEST_CONFIG: ServerConfig = {
  databaseUrl: "задаёт база теста",
  authSecret: "test-secret-0123456789-0123456789-0123456789",
  publicUrl: "http://localhost:5175",
  host: "127.0.0.1",
  port: 3400,
};
