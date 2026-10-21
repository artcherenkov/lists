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
            "apps/*/scripts/**/__tests__/**/*.test.ts",
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
          // Все тесты на базе, где бы ни лежали: unit их исключает, иначе они не шли бы нигде.
          include: ["**/__tests__/**/*.db.test.ts"],
          exclude: ["**/node_modules/**"],
          globalSetup: ["apps/server/src/__tests__/prepare-postgres.ts"],
        },
      },
    ],
  },
});
