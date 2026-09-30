import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "apps/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "packages/*/src/**/__tests__/**/*.test.{ts,tsx}",
      "tests/fixtures/**/__tests__/**/*.test.ts",
    ],
  },
});
