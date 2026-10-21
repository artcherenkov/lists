import type { AuthConfig } from "../auth/auth.ts";

/** Настройки входа в тестах; базу каждый тест берёт свою из `createTestDatabase`. */
export const TEST_AUTH_CONFIG: AuthConfig = {
  publicUrl: "http://localhost:5175",
  authSecret: "test-secret-0123456789-0123456789-0123456789",
};
