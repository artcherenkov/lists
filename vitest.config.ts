import { defineConfig } from "vitest/config";

// Unit-тесты живут в __tests__ рядом с кодом и не требуют браузера и сети.
export default defineConfig({
  test: {
    include: [
      "apps/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "packages/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "tests/fixtures/**/__tests__/**/*.test.ts",
    ],
  },
});
