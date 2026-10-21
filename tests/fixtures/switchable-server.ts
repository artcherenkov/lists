import type { PreviewServer } from "vite";

import { portOf, startPreview } from "./preview-server.ts";

export type SwitchableServer = {
  url: string;
  /** Отдаёт вторую сборку на том же адресе. */
  switchToNextBuild: () => Promise<void>;
  /** Ждёт, пока сервер целиком ответит на очередной запрос этого пути, например `/sw.js`. */
  waitUntilServed: (pathname: string) => Promise<void>;
  /** После остановки порт закрыт – как у недоступного сервера. Повторный вызов ничего не делает. */
  stop: () => Promise<void>;
};

/**
 * Сервер двух сборок на одном адресе: сначала отдаёт `firstBuildDir`, после `switchToNextBuild`
 * – `nextBuildDir`. Каталоги – абсолютные пути. С `apiUrl` обе сборки ведут `/api/` на этот сервер.
 */
export async function startSwitchableServer(builds: {
  firstBuildDir: string;
  nextBuildDir: string;
  apiUrl?: string;
}): Promise<SwitchableServer> {
  const { apiUrl } = builds;
  const waiters = new Set<{ pathname: string; resolve: () => void }>();
  const onServed = (pathname: string) => {
    for (const waiter of waiters) {
      if (waiter.pathname !== pathname) continue;
      waiters.delete(waiter);
      waiter.resolve();
    }
  };

  let current: PreviewServer | undefined = await startPreview(builds.firstBuildDir, {
    apiUrl,
    onServed,
  });
  const port = portOf(current);

  const stop = async () => {
    const stopping = current;
    current = undefined;
    await stopping?.close();
  };

  return {
    url: `http://127.0.0.1:${port}`,
    stop,
    // Каталог сборки `vite preview` получает при запуске, поэтому переключение – перезапуск на том
    // же порту.
    switchToNextBuild: async () => {
      await stop();
      current = await startPreview(builds.nextBuildDir, { port, apiUrl, onServed });
    },
    waitUntilServed: (pathname) =>
      new Promise((resolve) => {
        waiters.add({ pathname, resolve });
      }),
  };
}
