import type { Page } from "@playwright/test";

import { expect, test, waitForServiceWorker } from "../../fixtures/index.ts";

test.use({ serviceWorkers: "allow" });

const heading = (target: Page) => target.getByRole("heading", { level: 1, name: "Вотчлист" });

test("после первого открытия приложение запускается без сети", async ({ page, context }) => {
  const failedRequests: string[] = [];
  context.on("requestfailed", (request) => failedRequests.push(request.url()));

  await test.step("первое открытие в сети: worker скачал сборку целиком", async () => {
    await page.goto("/");
    await expect(heading(page)).toBeVisible();
    await waitForServiceWorker(page);
  });

  await context.setOffline(true);

  await test.step("перезагрузка без сети показывает приложение", async () => {
    await page.reload();
    await expect(heading(page)).toBeVisible();
  });

  await test.step("новая страница без сети показывает приложение", async () => {
    const another = await context.newPage();
    await another.goto("/");
    await expect(heading(another)).toBeVisible();
  });

  // Не попавший в предкеш файл (например, шрифт) виден только здесь: страница без него живёт.
  expect(failedRequests).toEqual([]);
});

test("без сети адрес вне сборки открывает приложение, а /api/ worker не перехватывает", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(heading(page)).toBeVisible();
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto("/lists/42");
  await expect(heading(page)).toBeVisible();

  await expect(page.goto("/api/lists")).rejects.toThrow("net::ERR_INTERNET_DISCONNECTED");
});
