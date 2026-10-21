import type { AddressInfo } from "node:net";
import type { PreviewServer } from "vite";

import { preview } from "vite";

/**
 * Отдаёт собранный каталог готовым `preview()` из Vite на `127.0.0.1`: единственное место запуска
 * `preview` у кирпичиков сервера. `onServed` вызывается, когда сервер целиком ответил на запрос.
 * Порт 0 – свободный; с другим портом занятый порт – ошибка, а не молчаливая замена. С `apiUrl`
 * запросы `/api/` идут на сервер по этому адресу, как их ведёт Caddy на v2, с заголовком
 * `X-Real-IP`. Caddy ставит в него адрес браузера, а здесь он остаётся, если его задал тест: у
 * каждого теста свой адрес и свой предел попыток входа.
 */
export async function startPreview(
  buildDir: string,
  options: { port?: number; apiUrl?: string; onServed?: (pathname: string) => void } = {},
): Promise<PreviewServer> {
  const { port = 0, apiUrl, onServed } = options;
  return preview({
    configFile: false,
    root: buildDir,
    logLevel: "error",
    build: { outDir: buildDir },
    // host не 0.0.0.0: сервер не должен быть виден из сети.
    preview: {
      host: "127.0.0.1",
      port,
      strictPort: port !== 0,
      open: false,
      proxy: apiUrl
        ? {
            "/api/": {
              target: apiUrl,
              configure: (proxy) =>
                proxy.on("proxyReq", (proxyRequest) => {
                  if (!proxyRequest.getHeader("x-real-ip")) {
                    proxyRequest.setHeader("x-real-ip", "127.0.0.1");
                  }
                }),
            },
          }
        : undefined,
    },
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
            response.on("finish", () => onServed?.(pathname));
            next();
          });
        },
      },
    ],
  });
}

export function portOf(server: PreviewServer): number {
  return (server.httpServer.address() as AddressInfo).port;
}
