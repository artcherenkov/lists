import { defineConfig } from "@playwright/test";

// Тесты идут на production-сборке (`pnpm exec vite build`), которую отдаёт server/preview.ts.
export default defineConfig({
  testDir: "tests",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  projects: [{ name: "chromium" }, { name: "webkit" }],
});
