import type { AddressInfo } from "node:net";

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { preview } from "vite";

// Кирпичик «приложение»: собранный apps/watchlist/dist на свободном порту 127.0.0.1.
// Отдаёт его готовый vite preview. Один воркер – один сервер, тесты внутри воркера идут подряд.
export type AppServer = { url: string; close: () => Promise<void> };

const appRoot = fileURLToPath(new URL("../../apps/watchlist/", import.meta.url));

export async function startAppServer(): Promise<AppServer> {
  if (!existsSync(`${appRoot}dist/index.html`)) {
    throw new Error("Нет сборки apps/watchlist/dist: e2e запускают через pnpm test:e2e");
  }
  const server = await preview({
    root: appRoot,
    logLevel: "error",
    // Порт 0 – система выдаёт свободный; host не 0.0.0.0, чтобы сервер не виден был из сети.
    preview: { host: "127.0.0.1", port: 0, open: false },
  });
  const { port } = server.httpServer.address() as AddressInfo;
  return { url: `http://127.0.0.1:${port}`, close: () => server.close() };
}
