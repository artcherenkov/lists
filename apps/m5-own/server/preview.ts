import type { IncomingMessage, ServerResponse } from "node:http";

// Стенд для тестов: статика из dist и прокси /api/d/<устройство>/* к серверу. Прокси умеет то, чего
// не умеет браузер: «сети нет» для одного устройства (обрыв соединений, в том числе долгого запроса),
// недоступная отправка при работающей загрузке и потерянный ответ после того, как сервер запрос принял.
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, request } from "node:http";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PREVIEW_PORT ?? 14400);
const SERVER_PORT = Number(process.env.SERVER_PORT ?? 13400);
const DIST = process.env.DIST ?? new URL("../dist", import.meta.url).pathname;
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".json": "application/json",
};

interface Net {
  offline: boolean;
  blockPush: boolean;
  /** Сколько ближайших ответов на отправку потерять. */
  losePush: number;
  open: Set<{ destroy(): void }>;
}
const devices = new Map<string, Net>();
const net = (dev: string): Net => {
  if (!devices.has(dev))
    devices.set(dev, { offline: false, blockPush: false, losePush: 0, open: new Set() });
  return devices.get(dev)!;
};

function control(url: URL, res: ServerResponse) {
  const state = net(url.searchParams.get("dev")!);
  const param = (name: string) => url.searchParams.get(name);
  if (param("offline") !== null) state.offline = param("offline") === "1";
  if (param("blockPush") !== null) state.blockPush = param("blockPush") === "1";
  if (param("losePush") !== null) state.losePush = Number(param("losePush"));
  if (state.offline) {
    state.open.forEach((c) => c.destroy());
    state.open.clear();
  }
  res.end("ok");
}

function proxy(dev: string, rest: string, req: IncomingMessage, res: ServerResponse) {
  const state = net(dev);
  const isPush = rest.startsWith("/push");
  if (state.offline || (isPush && state.blockPush)) return void req.socket.destroy();
  const upstream = request(
    {
      host: "127.0.0.1",
      port: SERVER_PORT,
      path: "/api" + rest,
      method: req.method,
      headers: req.headers,
    },
    (answer) => {
      if (isPush && state.losePush > 0) {
        state.losePush--;
        answer.resume();
        answer.on("end", () => req.socket.destroy());
        return;
      }
      res.writeHead(answer.statusCode!, answer.headers);
      answer.pipe(res);
    },
  );
  state.open.add(upstream).add(res);
  upstream.on("close", () => state.open.delete(upstream));
  upstream.on("error", () => res.destroy());
  req.pipe(upstream);
}

createServer((req, res) => {
  const url = new URL(req.url!, "http://x");
  if (url.pathname === "/__net") return control(url, res);
  const m = /^\/api\/d\/([^/]+)(\/.*)$/.exec(url.pathname);
  if (m) return proxy(m[1]!, m[2]! + url.search, req, res);
  // Без прокси устройства: прямой доступ к серверу, как у Caddy в релизе (проверка собранного релиза).
  if (url.pathname.startsWith("/api/"))
    return proxy("direct", url.pathname.slice("/api".length) + url.search, req, res);
  // Как навигация worker: у /ps/ своя страница, у остального – основная.
  const fallback = join(DIST, url.pathname.startsWith("/ps/") ? "ps/index.html" : "index.html");
  let file = normalize(
    join(DIST, url.pathname.endsWith("/") ? url.pathname + "index.html" : url.pathname),
  );
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory()) file = fallback;
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("preview on", PORT));
