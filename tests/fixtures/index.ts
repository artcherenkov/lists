import type { AppServer } from "./server.ts";

import { test as base, expect } from "@playwright/test";

import { isOwnAddress } from "./address.ts";
import { startAppServer } from "./server.ts";

export { expect };

// Кирпичики e2e. Тест перечисляет нужные в аргументах, Playwright создаёт только их.
// На воркер: server. На тест: ownAddressesOnly, он включён всегда.
type WorkerFixtures = { server: AppServer };
type TestFixtures = { ownAddressesOnly: void };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Собранное приложение на свободном порту; браузер открывает его по baseURL.
  server: [
    // oxlint-disable-next-line no-empty-pattern -- так Playwright объявляет фикстуру без зависимостей
    async ({}, use) => {
      const server = await startAppServer();
      await use(server);
      await server.close();
    },
    { scope: "worker" },
  ],
  baseURL: async ({ server }, use) => {
    await use(server.url);
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
