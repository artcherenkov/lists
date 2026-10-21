import { defineConfig } from "vitest/config";

// Где лежат тесты. Пути от корня, а не `**`: в основной копии `**` нашёл бы и тесты чужих
// worktree в `.claude/worktrees`.
const TEST_ROOTS = [
  "apps/*/src",
  "apps/*/build",
  "apps/*/scripts",
  "packages/*/src",
  "tests/fixtures",
];

// unit – без сети и базы, их гоняет и хук pre-push; db – тесты на настоящем Postgres.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: TEST_ROOTS.map((root) => `${root}/**/__tests__/**/*.test.{ts,tsx}`),
          exclude: ["**/node_modules/**", "**/*.db.test.ts"],
        },
      },
      {
        test: {
          name: "db",
          // Те же места, что у unit: он тесты на базе исключает, иначе они не шли бы нигде.
          include: TEST_ROOTS.map((root) => `${root}/**/__tests__/**/*.db.test.ts`),
          globalSetup: ["apps/server/src/__tests__/prepare-postgres.ts"],
        },
      },
    ],
  },
});
