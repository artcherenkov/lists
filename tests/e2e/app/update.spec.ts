import type { SwitchableServer } from "../../fixtures/switchable-server.ts";
import type { Page } from "@playwright/test";

import { expect, returnToApp, testWithOwnServer as test } from "../../fixtures/index.ts";

test.use({ serviceWorkers: "allow" });

// Номер второй сборки задаёт скрипт build:next в apps/watchlist/package.json.
const NEXT_VERSION = "2000-01-01 · 2222222";

const newVersionButton = (page: Page) =>
  page.getByRole("button", {
    name: "Вышла новая версия Нажмите, чтобы обновить приложение",
    exact: true,
  });

const waitForPrecache = (page: Page) => page.evaluate(() => navigator.serviceWorker.ready);

/**
 * Первая сборка открыта, worker скачал её и управляет страницей. После перезагрузки управляемой
 * страницы Chromium сам запрашивает `sw.js` через пару секунд, и если сервер к этому моменту уже
 * переключён, новая версия находится без проверки приложения. Тест дожидается запроса браузера
 * до переключения; на стороне страницы он не виден, поэтому ждёт ответа сервера.
 */
async function openFirstBuildUnderWorker(page: Page, ownServer: SwitchableServer) {
  await page.goto("/");
  await waitForPrecache(page);
  const browserCheck = ownServer.waitUntilServed("/sw.js");
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await browserCheck;
}

async function expectVersion(page: Page, version: string) {
  await page.getByRole("button", { name: "Профиль" }).click();
  await expect(page.getByRole("dialog", { name: "Профиль" }).getByRole("definition")).toHaveText(
    version,
  );
}

test("при возвращении на экран приложение находит новую версию и предлагает обновиться", async ({
  page,
  ownServer,
}) => {
  await openFirstBuildUnderWorker(page, ownServer);
  await expect(newVersionButton(page)).toBeHidden();

  await ownServer.switchToNextBuild();
  await returnToApp(page);

  await expect(newVersionButton(page)).toBeVisible();
});

test("раз в час приложение проверяет новую версию, пока открыто", async ({
  page,
  clock,
  ownServer,
}) => {
  await openFirstBuildUnderWorker(page, ownServer);

  await ownServer.switchToNextBuild();
  await clock.advance(60 * 60 * 1000);

  await expect(newVersionButton(page)).toBeVisible();
});

test("«Обновить» включает новую версию и перезагружает страницу", async ({ page, ownServer }) => {
  await openFirstBuildUnderWorker(page, ownServer);
  await ownServer.switchToNextBuild();
  await returnToApp(page);

  await newVersionButton(page).click();

  await expect(newVersionButton(page)).toBeHidden();
  await expectVersion(page, NEXT_VERSION);
});

test("«Обновить» работает без сети: новая версия уже скачана целиком", async ({
  page,
  context,
  ownServer,
}) => {
  await openFirstBuildUnderWorker(page, ownServer);
  await ownServer.switchToNextBuild();
  await returnToApp(page);
  await expect(newVersionButton(page)).toBeVisible();

  await context.setOffline(true);
  await ownServer.stop();
  await newVersionButton(page).click();

  await expect(newVersionButton(page)).toBeHidden();
  await expectVersion(page, NEXT_VERSION);
});

test("«Обновить» в сеансе первого открытия переходит на новую версию, не дожидаясь таймаута", async ({
  page,
  ownServer,
}) => {
  await page.goto("/");
  await waitForPrecache(page);
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
  await ownServer.switchToNextBuild();
  await returnToApp(page);

  await newVersionButton(page).click();

  // Таймаут обновления – 3 секунды: если страницу перезагрузил он, а не включение новой версии,
  // номер до этого срока не появится.
  await expect(newVersionButton(page)).toBeHidden({ timeout: 2500 });
  await expectVersion(page, NEXT_VERSION);
});

test("«Обновить», когда новая версия не включилась за 3 секунды, всё равно перезагружает страницу, и кнопка возвращается", async ({
  page,
  ownServer,
}) => {
  await openFirstBuildUnderWorker(page, ownServer);
  await ownServer.switchToNextBuild();
  await returnToApp(page);
  await expect(newVersionButton(page)).toBeVisible();

  // Подменяется платформа: настоящий worker включается по сообщению SKIP_WAITING, и другим
  // способом условие «новая версия не включилась» не создать. Метка пропадёт вместе со страницей.
  await page.evaluate(() => {
    ServiceWorker.prototype.postMessage = () => {};
    Object.assign(window, { isOldPage: true });
  });
  await newVersionButton(page).click();

  await page.waitForFunction(() => !("isOldPage" in window), undefined, { timeout: 10_000 });
  await expect(newVersionButton(page)).toBeVisible();
  await page.getByRole("button", { name: "Профиль" }).click();
  const version = page.getByRole("dialog", { name: "Профиль" }).getByRole("definition");
  await expect(version).toHaveText(/^\d{4}-\d{2}-\d{2} · [0-9a-f]{7}( · .+)?$/);
  await expect(version).not.toHaveText(NEXT_VERSION);
});

test("без нажатия новая версия включается, когда все страницы закрыты и приложение открыто снова", async ({
  page,
  context,
  ownServer,
}) => {
  await openFirstBuildUnderWorker(page, ownServer);
  await ownServer.switchToNextBuild();
  await returnToApp(page);
  await expect(newVersionButton(page)).toBeVisible();

  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");

  await expectVersion(reopened, NEXT_VERSION);
  await expect(newVersionButton(reopened)).toBeHidden();
});

test("недоступный сервер: проверка новой версии не оставляет ошибок на странице", async ({
  page,
  ownServer,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await openFirstBuildUnderWorker(page, ownServer);
  await ownServer.stop();

  await returnToApp(page);
  // Ещё одна проверка из теста: к её завершению отказ проверки приложения уже дошёл до страницы.
  // Без `catch` в приложении тест красный.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration!.update().catch(() => {});
  });

  expect(pageErrors).toEqual([]);
  await expect(newVersionButton(page)).toBeHidden();
});
