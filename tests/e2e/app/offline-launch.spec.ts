import type { Page } from "@playwright/test";

import { expect, test, waitForServiceWorker } from "../../fixtures/index.ts";

test.use({ serviceWorkers: "allow" });

// Значок «Профиль» есть только у списка: без сети приложение открывается вошедшим.
const listScreen = (target: Page) => target.getByRole("button", { name: "Профиль" });

test("после первого открытия приложение запускается без сети вошедшим", async ({
  page,
  context,
}) => {
  // Запросы к серверу без сети падают, и это не ошибка: сверку входа приложение повторит при
  // следующем запуске. Здесь ловим только файлы сборки.
  const failedBuildRequests: string[] = [];
  context.on("requestfailed", (request) => {
    if (!new URL(request.url()).pathname.startsWith("/api/"))
      failedBuildRequests.push(request.url());
  });

  await test.step("первое открытие в сети: worker скачал сборку целиком", async () => {
    await page.goto("/");
    await expect(listScreen(page)).toBeVisible();
    await waitForServiceWorker(page);
  });

  await context.setOffline(true);

  await test.step("перезагрузка без сети показывает приложение", async () => {
    await page.reload();
    await expect(listScreen(page)).toBeVisible();
  });

  await test.step("новая страница без сети показывает приложение", async () => {
    const another = await context.newPage();
    await another.goto("/");
    await expect(listScreen(another)).toBeVisible();
  });

  // Не попавший в предкеш файл (например, шрифт) виден только здесь: страница без него живёт.
  expect(failedBuildRequests).toEqual([]);
});

test("без сети адрес вне сборки открывает приложение", async ({ page, context }) => {
  await page.goto("/");
  await expect(listScreen(page)).toBeVisible();
  await waitForServiceWorker(page);
  await context.setOffline(true);

  await page.goto("/lists/42");
  await expect(listScreen(page)).toBeVisible();
});
