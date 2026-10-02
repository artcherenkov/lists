import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { portOf, startPreview } from "./preview-server.ts";
import { startSwitchableServer, type SwitchableServer } from "./switchable-server.ts";

export type AppServer = { url: string; stop: () => Promise<void> };

const appRoot = fileURLToPath(new URL("../../apps/watchlist/", import.meta.url));

function appBuildDir(name: "dist" | "dist-next"): string {
  const dir = `${appRoot}${name}`;
  if (!existsSync(`${dir}/index.html`)) {
    throw new Error(`Нет сборки apps/watchlist/${name}: e2e запускают через pnpm test:e2e`);
  }
  return dir;
}

export async function startAppServer(): Promise<AppServer> {
  const server = await startPreview(appBuildDir("dist"));
  return { url: `http://127.0.0.1:${portOf(server)}`, stop: () => server.close() };
}

/** Сервер, который отдаёт `dist`, а по `switchToNextBuild` – `dist-next` (скрипт `build:next`). */
export async function startSwitchableAppServer(): Promise<SwitchableServer> {
  return startSwitchableServer({
    firstBuildDir: appBuildDir("dist"),
    nextBuildDir: appBuildDir("dist-next"),
  });
}
