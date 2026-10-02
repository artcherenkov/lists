import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "apps/*/build/**/__tests__/**/*.test.ts",
      "packages/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "tests/fixtures/**/__tests__/**/*.test.ts",
    ],
  },
});
