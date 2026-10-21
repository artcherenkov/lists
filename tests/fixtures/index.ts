import type { FakeUser } from "../../apps/server/src/telegram/fake-bot-api.ts";
import type { PageClock } from "./clock.ts";
import type { AppServer } from "./server.ts";
import type { SwitchableServer } from "./switchable-server.ts";

import { test as base, expect } from "@playwright/test";

import { isOwnAddress } from "./address.ts";
import { installPageClock } from "./clock.ts";
import { startAppServer, startSwitchableAppServer } from "./server.ts";
import { newClientIp, newTelegramUser, signInWithoutScreen } from "./telegram.ts";

export { expect };
export { BOT_USERNAME } from "./api-server.ts";
export { breakClipboard, mendClipboard, readClipboard } from "./clipboard.ts";
export { escapeRegExp, journalLine, TIME_FORMAT } from "./journal-line.ts";
export { openJournal } from "./journal.ts";
export { openProfile, VERSION_FORMAT } from "./profile.ts";
export { waitForServiceWorker } from "./service-worker.ts";
export { centerOf, fingerTap, swipeDown } from "./swipe.ts";
export { codeFromBot, messageFromBot } from "./telegram.ts";
export { newVersionButton, openFirstBuildUnderWorker } from "./update.ts";
export {
  closeWithoutEvents,
  moveToBackground,
  prepareHiddenLaunch,
  prepareSilentClose,
  returnToApp,
  showApp,
} from "./visibility.ts";

type WorkerFixtures = { server: AppServer };
type TestFixtures = {
  ownAddressesOnly: void;
  noCspViolations: void;
  clock: PageClock;
  /** Тест идёт под вошедшим человеком. Экран входа проверяют с `test.use({ signedIn: false })`. */
  signedIn: boolean;
  /** Человек в Telegram у этого теста; с `signedIn` тест идёт под ним. */
  telegramUser: FakeUser;
  /** `X-Real-IP` запросов этого теста к серверу: у каждого теста свой предел попыток входа. */
  clientIp: string;
  signInBeforeTest: void;
};

export const test = base.extend<TestFixtures, WorkerFixtures>({
  server: [
    // oxlint-disable-next-line no-empty-pattern -- так Playwright объявляет фикстуру без зависимостей
    async ({}, use) => {
      const server = await startAppServer();
      await use(server);
      await server.stop();
    },
    // Запуск и остановка сервера – до 30 с каждый (`api-server.ts`), а общий таймаут – тоже 30 с:
    // с ним Playwright прервал бы фикстуру раньше, чем она доложит, что сервер завис.
    { scope: "worker", timeout: 60_000 },
  ],
  baseURL: async ({ server }, use) => {
    await use(server.url);
  },
  clock: async ({ page }, use) => {
    await use(await installPageClock(page));
  },
  signedIn: [true, { option: true }],
  // oxlint-disable-next-line no-empty-pattern -- так Playwright объявляет фикстуру без зависимостей
  telegramUser: async ({}, use) => {
    await use(newTelegramUser());
  },
  clientIp: [
    async ({ context }, use) => {
      const clientIp = newClientIp();
      await context.setExtraHTTPHeaders({ "x-real-ip": clientIp });
      await use(clientIp);
    },
    { auto: true },
  ],
  // Вход – до первой загрузки страницы: приложение без записи на устройстве спросит сессию у
  // сервера и откроет список.
  signInBeforeTest: [
    async ({ signedIn, context, server, telegramUser, clientIp }, use) => {
      if (signedIn) await signInWithoutScreen(context, server, telegramUser, clientIp);
      await use();
    },
    { auto: true },
  ],
  // Решение 14 плана: клиент обращается только к нашим адресам. Любой запрос страницы
  // на чужой адрес проваливает тест, даже если страница это пережила.
  ownAddressesOnly: [
    async ({ context, baseURL }, use) => {
      const appOrigin = new URL(baseURL!).origin;
      const foreign: string[] = [];
      context.on("request", (request) => {
        if (!isOwnAddress(request.url(), appOrigin)) foreign.push(request.url());
      });
      await use();
      if (foreign.length > 0) {
        throw new Error(`Страница обратилась к чужим адресам:\n${foreign.join("\n")}`);
      }
    },
    { auto: true },
  ],
  // Страницу защищает CSP из сборки: всё, что политика заблокировала, проваливает тест, даже если
  // страница это пережила. Chromium сообщает о нарушении ошибкой в консоли.
  noCspViolations: [
    async ({ context }, use) => {
      const violations: string[] = [];
      context.on("console", (message) => {
        if (message.type() === "error" && message.text().includes("Content Security Policy")) {
          violations.push(message.text());
        }
      });
      await use();
      if (violations.length > 0) {
        throw new Error(`Страница нарушила CSP:\n${violations.join("\n")}`);
      }
    },
    { auto: true },
  ],
});

/**
 * Тест со своим сервером: он отдаёт `dist`, а `switchToNextBuild` переключает его на `dist-next` на
 * том же адресе. Остальным тестам хватает общего сервера воркера.
 */
export const testWithOwnServer = test.extend<{ ownServer: SwitchableServer }>({
  ownServer: async ({ server }, use) => {
    const ownServer = await startSwitchableAppServer(server.api);
    await use(ownServer);
    await ownServer.stop();
  },
  baseURL: async ({ ownServer }, use) => {
    await use(ownServer.url);
  },
});
