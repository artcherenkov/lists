import type { AddressInfo } from "node:net";

import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

import { type ApiServer, startApiServer } from "./api-server.ts";
import { portOf, startPreview } from "./preview-server.ts";
import { startSwitchableServer, type SwitchableServer } from "./switchable-server.ts";

/** Сайт, как на v2: собранное приложение и `/api/` на сервер `api`. */
export type AppServer = { url: string; api: ApiServer; stop: () => Promise<void> };

const appRoot = fileURLToPath(new URL("../../apps/watchlist/", import.meta.url));

function appBuildDir(name: "dist" | "dist-next"): string {
  const dir = `${appRoot}${name}`;
  if (!existsSync(`${dir}/index.html`)) {
    throw new Error(`Нет сборки apps/watchlist/${name}: e2e запускают через pnpm test:e2e`);
  }
  return dir;
}

/** Свободный порт: сайту он нужен до запуска сервера, а серверу – адрес сайта. */
async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise((resolve) => probe.close(resolve));
  return port;
}

export async function startAppServer(): Promise<AppServer> {
  const apiPort = await freePort();
  const site = await startPreview(appBuildDir("dist"), { apiUrl: `http://127.0.0.1:${apiPort}` });
  const url = `http://127.0.0.1:${portOf(site)}`;
  let api: ApiServer;
  try {
    api = await startApiServer({ port: apiPort, publicUrl: url });
  } catch (error) {
    await site.close();
    throw error;
  }
  return {
    url,
    api,
    stop: async () => {
      try {
        await site.close();
      } finally {
        await api.stop();
      }
    },
  };
}

/**
 * Сервер, который отдаёт `dist`, а по `switchToNextBuild` – `dist-next` (скрипт `build:next`);
 * `/api/` ведёт на `api`. Адрес у него свой, а `PUBLIC_URL` сервера – адрес сайта воркера, поэтому
 * сессию по cookie он видит, а вход и выход (`POST`) сервер отклонит по `Origin`.
 */
export async function startSwitchableAppServer(api: ApiServer): Promise<SwitchableServer> {
  return startSwitchableServer({
    firstBuildDir: appBuildDir("dist"),
    nextBuildDir: appBuildDir("dist-next"),
    apiUrl: api.url,
  });
}
