import type { AddressInfo } from "node:net";

import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

import { sha256 } from "../checksums.ts";
import { verifySite } from "../verify-site.ts";

const FILES: Record<string, string> = {
  "index.html": "<!doctype html><title>page</title>",
  "sw.js": "console.log('sw')",
  "manifest.webmanifest": "{}",
  "assets/index-abc123.js": "console.log('app')",
};

const ENTRIES = Object.entries(FILES).map(([path, content]) => ({
  path: `site/${path}`,
  sha256: sha256(new TextEncoder().encode(content)),
}));

/** Время изменения файлов сайта: проверка на устаревшие валидаторы должна быть позже него. */
const FILE_MODIFIED_AT = Date.UTC(2026, 0, 1);

interface SiteBehaviour {
  /** Срезает `If-None-Match` из запроса, как `request_header -If-None-Match` в Caddyfile. */
  stripIfNoneMatch: boolean;
  /** Срезает `If-Modified-Since`. */
  stripIfModifiedSince: boolean;
  /** Подменяет содержимое файла по этому пути. */
  corrupt?: string;
  /** Отвечает на `/` перенаправлением. */
  redirectRoot?: boolean;
  /** Отвечает на `/index.html` перенаправлением, как `http.FileServer` из стандартной библиотеки Go. */
  redirectIndexHtml?: boolean;
}

const CORRECT: SiteBehaviour = { stripIfNoneMatch: true, stripIfModifiedSince: true };

let server: Server | undefined;

afterEach(async () => {
  if (server) await new Promise((resolve) => server!.close(resolve));
  server = undefined;
});

/**
 * Сайт, который отвечает как Caddy с `file_server`: `If-None-Match: *` и `If-Modified-Since` в
 * будущем без срезки заголовков дают `304` (Go `http.ServeContent`, `checkPreconditions`).
 */
async function startSite(behaviour: SiteBehaviour): Promise<string> {
  server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://site.test");
    if (url.pathname.startsWith("/api/")) {
      response.writeHead(404).end();
      return;
    }
    if (url.pathname === "/" && behaviour.redirectRoot) {
      response.writeHead(308, { location: "/index.html" }).end();
      return;
    }

    if (url.pathname === "/index.html" && behaviour.redirectIndexHtml) {
      response.writeHead(301, { location: "./" }).end();
      return;
    }

    const path = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const content = FILES[path];
    if (content === undefined) {
      response.writeHead(404).end();
      return;
    }

    const ifNoneMatch = behaviour.stripIfNoneMatch ? undefined : request.headers["if-none-match"];
    const ifModifiedSince = behaviour.stripIfModifiedSince
      ? undefined
      : request.headers["if-modified-since"];
    const unchanged =
      ifNoneMatch === "*" ||
      (ifNoneMatch === undefined &&
        ifModifiedSince !== undefined &&
        Date.parse(ifModifiedSince) >= FILE_MODIFIED_AT);
    if (unchanged && path === "sw.js") {
      response.writeHead(304).end();
      return;
    }

    const assets = path.startsWith("assets/");
    response.writeHead(200, {
      "cache-control": assets ? "public, max-age=31536000, immutable" : "no-cache",
      "x-robots-tag": "noindex",
    });
    response.end(path === behaviour.corrupt ? "tampered" : content);
  });
  await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe("проверка сайта по HTTP-ответам", () => {
  it("сайт отвечает как задумано – годен, проверены все файлы релиза", async () => {
    const url = await startSite(CORRECT);

    expect(await verifySite(url, ENTRIES)).toEqual({
      verdict: { ok: true },
      filesChecked: ENTRIES.length,
    });
  });

  it("подменённое содержимое файла – провал с именем файла", async () => {
    const url = await startSite({ ...CORRECT, corrupt: "assets/index-abc123.js" });

    const { verdict } = await verifySite(url, ENTRIES);

    expect(verdict).toEqual({
      ok: false,
      reasons: ["/assets/index-abc123.js: содержимое не совпадает с суммой из SHA256SUMS"],
    });
  });

  it("сайт не срезает If-None-Match: sw.js получает 304 – провал", async () => {
    const url = await startSite({ ...CORRECT, stripIfNoneMatch: false });

    const { verdict } = await verifySite(url, ENTRIES);

    expect(verdict).toEqual({
      ok: false,
      reasons: ["sw.js с устаревшим If-None-Match: ответ 304 вместо 200"],
    });
  });

  it("сайт не срезает If-Modified-Since: sw.js получает 304 – провал", async () => {
    const url = await startSite({ ...CORRECT, stripIfModifiedSince: false });

    const { verdict } = await verifySite(url, ENTRIES);

    expect(verdict).toEqual({
      ok: false,
      reasons: ["sw.js с устаревшим If-Modified-Since: ответ 304 вместо 200"],
    });
  });

  it("перенаправление вместо файла – провал, а не чтение другого адреса", async () => {
    const url = await startSite({ ...CORRECT, redirectRoot: true });

    const { verdict } = await verifySite(url, ENTRIES);

    expect(verdict).toEqual({
      ok: false,
      reasons: ["/: ответ 308 вместо 200"],
    });
  });

  it("страница по /index.html отвечает не 200 – провал: этот адрес запрашивает предкеш Workbox", async () => {
    const url = await startSite({ ...CORRECT, redirectIndexHtml: true });

    const { verdict } = await verifySite(url, ENTRIES);

    expect(verdict).toEqual({
      ok: false,
      reasons: ["/index.html: ответ 301 вместо 200"],
    });
  });

  it("сайт не ответил – исключение, а не вердикт «вернуть»", async () => {
    const url = await startSite(CORRECT);
    await new Promise((resolve) => server!.close(resolve));
    server = undefined;

    await expect(verifySite(url, ENTRIES)).rejects.toThrow(/Не удалось проверить сайт/);
  });

  it("остановка операции во время проверки – её причина, а не «сайт не ответил»", async () => {
    const url = await startSite(CORRECT);
    const stop = new AbortController();
    stop.abort(new Error("операция остановлена"));

    await expect(verifySite(url, ENTRIES, stop.signal)).rejects.toThrow("операция остановлена");
  });
});
