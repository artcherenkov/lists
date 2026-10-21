import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

// Приложение и сервер поднимает фикстура воркера из tests/fixtures, поэтому webServer здесь нет,
// а --list ничего не запускает.
export default defineConfig({
  testDir: "tests/e2e",
  // Сервер e2e работает на Postgres стека разработки, как тесты на базе: подготовка та же.
  globalSetup: "./apps/server/src/__tests__/prepare-postgres.ts",
  outputDir: "test-results",
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  retries: 0,
  // test.only в CI останавливает запуск: локальная отладка не должна сузить набор незаметно.
  forbidOnly: Boolean(process.env.CI),
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    // Chromium, а не WebKit: снимки WebKit сверяются с автором отдельно.
    ...devices["Desktop Chrome"],
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
    locale: "ru-RU",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
