import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

// Единственный набор e2e. Приложение поднимает фикстура воркера в tests/fixtures,
// поэтому webServer здесь нет, а --list ничего не запускает.
export default defineConfig({
  testDir: "tests/e2e",
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
    ...devices["Desktop Chrome"],
    // Chromium с размерами и касаниями iPhone: WebKit-снимки сверяются с автором отдельно.
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
