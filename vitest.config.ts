import { defineConfig } from "vitest/config";

// unit – без сети и базы, их гоняет и хук pre-push; db – тесты сервера на настоящем Postgres.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: [
            "apps/*/src/**/__tests__/**/*.test.{ts,tsx}",
            "apps/*/build/**/__tests__/**/*.test.ts",
            "packages/*/src/**/__tests__/**/*.test.{ts,tsx}",
            "tests/fixtures/**/__tests__/**/*.test.ts",
          ],
          exclude: ["**/node_modules/**", "**/*.db.test.ts"],
        },
      },
      {
        test: {
          name: "db",
          include: ["apps/server/src/**/__tests__/**/*.db.test.ts"],
          globalSetup: ["apps/server/src/__tests__/prepare-postgres.ts"],
        },
      },
    ],
  },
});
