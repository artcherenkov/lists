import type { Socket } from "node:net";

import { createReadStream, existsSync, statSync } from "node:fs";
// «Preview» клиента: статика из dist, прокси /api/d/<устройство> -> наш сервер.
// /__net/off рвёт открытые соединения устройства и отвечает на /api обрывом: «сети нет», а страница грузится.
import { createServer, request } from "node:http";
import { extname, join, normalize } from "node:path";

const PORT = 14273;
const DIST = new URL("../dist", import.meta.url).pathname;
const TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".css": "text/css",
  ".map": "application/json",
};
const offline = new Set<string>();
const sockets = new Set<Socket>();
const pending = new Map<string, Set<{ destroy(): void }>>();
const pendingOf = (dev: string) => pending.get(dev) ?? pending.set(dev, new Set()).get(dev)!;

const server = createServer((req, res) => {
  const url = new URL(req.url!, "http://x");
  const dev = url.searchParams.get("dev") ?? "";
  if (url.pathname === "/__net/off") {
    offline.add(dev);
    pendingOf(dev).forEach((p) => p.destroy());
    pendingOf(dev).clear();
    res.end("off");
    return;
  }
  if (url.pathname === "/__net/on") {
    offline.delete(dev);
    res.end("on");
    return;
  }
  // устройство в пути нужно, чтобы выключать сеть по одному
  const m = /^\/(api)\/d\/([^/]+)(\/.*)$/.exec(url.pathname);
  const proxy = m ? 13200 : 0;
  if (proxy && m) {
    const pdev = m[2]!;
    if (offline.has(pdev) || offline.has("*")) {
      req.socket.destroy();
      return;
    }
    const path = m[3]! + url.search;
    const up = request(
      {
        host: "127.0.0.1",
        port: proxy,
        path,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${proxy}` },
      },
      (r) => {
        res.writeHead(r.statusCode!, r.headers);
        r.pipe(res);
      },
    );
    pendingOf(pdev).add(up);
    up.on("close", () => pendingOf(pdev).delete(up));
    pendingOf(pdev).add(res as any);
    up.on("error", () => res.destroy());
    req.pipe(up);
    return;
  }
  let file = normalize(join(DIST, url.pathname === "/" ? "index.html" : url.pathname));
  if (!file.startsWith(DIST) || !existsSync(file) || statSync(file).isDirectory())
    file = join(DIST, "index.html");
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
});
server.on("connection", (s) => {
  sockets.add(s);
  s.on("close", () => sockets.delete(s));
});
server.listen(PORT, "127.0.0.1", () => console.log("preview on", PORT));
