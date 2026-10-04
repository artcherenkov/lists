import type { Page } from "@playwright/test";

import {
  expect,
  newVersionButton,
  openFirstBuildUnderWorker,
  openProfile,
  returnToApp,
  testWithOwnServer as test,
  VERSION_FORMAT,
  waitForServiceWorker,
} from "../../fixtures/index.ts";

test.use({ serviceWorkers: "allow" });

// Номер второй сборки задаёт скрипт build:next в apps/watchlist/package.json.
const NEXT_VERSION = "2000-01-01 · 2222222";

async function expectVersion(page: Page, expected: string) {
  const { version } = await openProfile(page);
  await expect(version).toHaveText(expected);
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
  await waitForServiceWorker(page);
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
  const { version } = await openProfile(page);
  await expect(version).toHaveText(VERSION_FORMAT);
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
