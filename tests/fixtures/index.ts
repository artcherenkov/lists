import type { PageClock } from "./clock.ts";
import type { AppServer } from "./server.ts";
import type { SwitchableServer } from "./switchable-server.ts";

import { test as base, expect } from "@playwright/test";

import { isOwnAddress } from "./address.ts";
import { installPageClock } from "./clock.ts";
import { startAppServer, startSwitchableAppServer } from "./server.ts";

export { expect };
export { breakClipboard, mendClipboard, readClipboard } from "./clipboard.ts";
export { escapeRegExp, journalLine, TIME_FORMAT } from "./journal-line.ts";
export { openJournal } from "./journal.ts";
export { openProfile, VERSION_FORMAT } from "./profile.ts";
export { waitForServiceWorker } from "./service-worker.ts";
export { centerOf, fingerTap, swipeDown } from "./swipe.ts";
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
type TestFixtures = { ownAddressesOnly: void; clock: PageClock };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  server: [
    // oxlint-disable-next-line no-empty-pattern -- так Playwright объявляет фикстуру без зависимостей
    async ({}, use) => {
      const server = await startAppServer();
      await use(server);
      await server.stop();
    },
    { scope: "worker" },
  ],
  baseURL: async ({ server }, use) => {
    await use(server.url);
  },
  clock: async ({ page }, use) => {
    await use(await installPageClock(page));
  },
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
});

/**
 * Тест со своим сервером: он отдаёт `dist`, а `switchToNextBuild` переключает его на `dist-next` на
 * том же адресе. Остальным тестам хватает общего сервера воркера.
 */
export const testWithOwnServer = test.extend<{ ownServer: SwitchableServer }>({
  // oxlint-disable-next-line no-empty-pattern -- так Playwright объявляет фикстуру без зависимостей
  ownServer: async ({}, use) => {
    const server = await startSwitchableAppServer();
    await use(server);
    await server.stop();
  },
  baseURL: async ({ ownServer }, use) => {
    await use(ownServer.url);
  },
});
