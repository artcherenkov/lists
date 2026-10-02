import type { AddressInfo } from "node:net";
import type { PreviewServer } from "vite";

import { preview } from "vite";

export type SwitchableServer = {
  url: string;
  /** Отдаёт вторую сборку на том же адресе. */
  switchToNextBuild: () => Promise<void>;
  /** Ждёт, пока сервер целиком ответит на очередной запрос этого пути, например `/sw.js`. */
  waitUntilServed: (pathname: string) => Promise<void>;
  /** После остановки порт закрыт – как у недоступного сервера. Повторный вызов ничего не делает. */
  stop: () => Promise<void>;
};

// Каталог сборки `vite preview` получает при запуске, поэтому переключение – перезапуск
// на том же порту.
async function startPreview(
  outDir: string,
  port: number,
  onServed: (pathname: string) => void,
): Promise<PreviewServer> {
  return preview({
    configFile: false,
    root: outDir,
    logLevel: "error",
    build: { outDir },
    // host не 0.0.0.0: сервер не должен быть виден из сети.
    preview: { host: "127.0.0.1", port, strictPort: port !== 0, open: false },
    plugins: [
      {
        name: "tests:full-responses-only",
        configurePreviewServer(server) {
          // Без валидаторов sirv не может ответить 304 – только полным ответом. Почему это нужно
          // тестам обновления, написано в docs/testing.md.
          server.middlewares.use((request, response, next) => {
            delete request.headers["if-none-match"];
            delete request.headers["if-modified-since"];
            const { pathname } = new URL(request.url ?? "/", "http://localhost");
            response.on("finish", () => onServed(pathname));
            next();
          });
        },
      },
    ],
  });
}

function portOf(server: PreviewServer): number {
  return (server.httpServer.address() as AddressInfo).port;
}

/**
 * Сервер двух сборок на одном адресе: сначала отдаёт `firstBuildDir`, после `switchToNextBuild`
 * – `nextBuildDir`. Каталоги – абсолютные пути.
 */
export async function startSwitchableServer(builds: {
  firstBuildDir: string;
  nextBuildDir: string;
}): Promise<SwitchableServer> {
  const waiters = new Set<{ pathname: string; resolve: () => void }>();
  const onServed = (pathname: string) => {
    for (const waiter of waiters) {
      if (waiter.pathname !== pathname) continue;
      waiters.delete(waiter);
      waiter.resolve();
    }
  };

  let current: PreviewServer | undefined = await startPreview(builds.firstBuildDir, 0, onServed);
  const port = portOf(current);

  const stop = async () => {
    const stopping = current;
    current = undefined;
    await stopping?.close();
  };

  return {
    url: `http://127.0.0.1:${port}`,
    stop,
    switchToNextBuild: async () => {
      await stop();
      current = await startPreview(builds.nextBuildDir, port, onServed);
    },
    waitUntilServed: (pathname) =>
      new Promise((resolve) => {
        waiters.add({ pathname, resolve });
      }),
  };
}
