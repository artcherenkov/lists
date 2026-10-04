import type { SwitchableServer } from "./switchable-server.ts";
import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import { waitForServiceWorker } from "./service-worker.ts";

export const newVersionButton = (page: Page) =>
  page.getByRole("button", {
    name: "Вышла новая версия Нажмите, чтобы обновить приложение",
    exact: true,
  });

/**
 * Первая сборка открыта, worker скачал её и управляет страницей. После перезагрузки управляемой
 * страницы Chromium сам запрашивает `sw.js` через пару секунд, и если сервер к этому моменту уже
 * переключён, новая версия находится без проверки приложения. Помощник дожидается запроса
 * браузера до переключения; на стороне страницы он не виден, поэтому ждёт ответа сервера.
 */
export async function openFirstBuildUnderWorker(page: Page, ownServer: SwitchableServer) {
  await page.goto("/");
  await waitForServiceWorker(page);
  const browserCheck = ownServer.waitUntilServed("/sw.js");
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await browserCheck;
}
