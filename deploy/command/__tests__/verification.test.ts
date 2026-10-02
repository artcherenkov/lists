import { describe, expect, it } from "vitest";

import {
  REVALIDATION_PROBES,
  assessApiStatus,
  assessFile,
  assessRevalidationProbe,
  assessSite,
  urlPathsForFile,
  type FileResponse,
} from "../verification.ts";

const SUM = "1".repeat(64);

/** Верный ответ на файл вне `assets/`: страница. */
function pageResponse(overrides: Partial<FileResponse> = {}): FileResponse {
  return {
    path: "index.html",
    urlPath: "/",
    expectedSha256: SUM,
    status: 200,
    headers: { "cache-control": "no-cache", "x-robots-tag": "noindex" },
    bodySha256: SUM,
    ...overrides,
  };
}

/** Верный ответ на хешированный файл из `assets/`. */
function assetResponse(overrides: Partial<FileResponse> = {}): FileResponse {
  return {
    path: "assets/index-abc123.js",
    urlPath: "/assets/index-abc123.js",
    expectedSha256: SUM,
    status: 200,
    headers: { "cache-control": "public, max-age=31536000, immutable" },
    bodySha256: SUM,
    ...overrides,
  };
}

describe("адреса, по которым проверяется файл", () => {
  it("страница – и по корню, и по /index.html: оба запрашивают браузер и предкеш", () => {
    expect(urlPathsForFile("index.html")).toEqual(["/", "/index.html"]);
  });

  it("остальные файлы – по своему пути", () => {
    expect(urlPathsForFile("sw.js")).toEqual(["/sw.js"]);
    expect(urlPathsForFile("assets/index-abc123.js")).toEqual(["/assets/index-abc123.js"]);
  });

  it("пробел в имени кодируется", () => {
    expect(urlPathsForFile("assets/my file.png")).toEqual(["/assets/my%20file.png"]);
  });
});

describe("оценка ответа на файл", () => {
  it("верная страница проходит", () => {
    expect(assessFile(pageResponse())).toEqual([]);
  });

  it("верный файл из assets/ проходит", () => {
    expect(assessFile(assetResponse())).toEqual([]);
  });

  it("не 200 – провал: заголовки такого ответа не оцениваются", () => {
    expect(assessFile(pageResponse({ status: 404, headers: {} }))).toEqual([
      "/: ответ 404 вместо 200",
    ]);
  });

  it("содержимое не совпало с суммой – провал", () => {
    expect(assessFile(assetResponse({ bodySha256: "2".repeat(64) }))).toEqual([
      "/assets/index-abc123.js: содержимое не совпадает с суммой из SHA256SUMS",
    ]);
  });

  it("вне assets/ нет no-cache – провал", () => {
    expect(assessFile(pageResponse({ headers: { "x-robots-tag": "noindex" } }))).toEqual([
      "/: в Cache-Control нет no-cache",
    ]);
  });

  it("no-cache среди других директив подходит", () => {
    expect(
      assessFile(
        pageResponse({
          path: "sw.js",
          urlPath: "/sw.js",
          headers: { "cache-control": "public, No-Cache, max-age=0" },
        }),
      ),
    ).toEqual([]);
  });

  it("вне assets/ есть ETag – провал", () => {
    expect(
      assessFile(
        pageResponse({
          path: "sw.js",
          urlPath: "/sw.js",
          headers: { "cache-control": "no-cache", etag: '"abc"' },
        }),
      ),
    ).toEqual(["/sw.js: ответ содержит ETag"]);
  });

  it("вне assets/ есть Last-Modified – провал", () => {
    expect(
      assessFile(
        pageResponse({
          path: "manifest.webmanifest",
          urlPath: "/manifest.webmanifest",
          headers: {
            "cache-control": "no-cache",
            "last-modified": "Tue, 01 Jan 2030 00:00:00 GMT",
          },
        }),
      ),
    ).toEqual(["/manifest.webmanifest: ответ содержит Last-Modified"]);
  });

  it("у assets/ нет immutable – провал", () => {
    expect(
      assessFile(assetResponse({ headers: { "cache-control": "public, max-age=31536000" } })),
    ).toEqual(["/assets/index-abc123.js: в Cache-Control нет immutable"]);
  });

  it("ETag и Last-Modified у файла из assets/ допустимы", () => {
    expect(
      assessFile(
        assetResponse({
          headers: {
            "cache-control": "public, max-age=31536000, immutable",
            etag: '"abc"',
            "last-modified": "Tue, 01 Jan 2030 00:00:00 GMT",
          },
        }),
      ),
    ).toEqual([]);
  });

  it("у страницы нет noindex – провал", () => {
    expect(assessFile(pageResponse({ headers: { "cache-control": "no-cache" } }))).toEqual([
      "/: в X-Robots-Tag нет noindex",
    ]);
  });

  it("noindex в списке значений X-Robots-Tag подходит", () => {
    expect(
      assessFile(
        pageResponse({
          headers: { "cache-control": "no-cache", "x-robots-tag": "noindex, nofollow" },
        }),
      ),
    ).toEqual([]);
  });

  it("noindex в любом регистре подходит", () => {
    expect(
      assessFile(
        pageResponse({ headers: { "cache-control": "no-cache", "x-robots-tag": "NoIndex" } }),
      ),
    ).toEqual([]);
  });

  it("несколько нарушений – все причины", () => {
    expect(
      assessFile(
        pageResponse({
          bodySha256: "2".repeat(64),
          headers: { etag: '"abc"' },
        }),
      ),
    ).toEqual([
      "/: содержимое не совпадает с суммой из SHA256SUMS",
      "/: в Cache-Control нет no-cache",
      "/: ответ содержит ETag",
      "/: в X-Robots-Tag нет noindex",
    ]);
  });
});

describe("проверка sw.js с устаревшими валидаторами", () => {
  it("запросы идут с If-None-Match и If-Modified-Since по отдельности", () => {
    expect(REVALIDATION_PROBES.map((probe) => Object.keys(probe.headers))).toEqual([
      ["if-none-match"],
      ["if-modified-since"],
    ]);
  });

  it("ответ 200 проходит", () => {
    expect(assessRevalidationProbe({ name: "If-None-Match", status: 200 })).toEqual([]);
  });

  it.each([304, 404, 500] as const)("ответ %i – провал с именем валидатора", (status) => {
    expect(assessRevalidationProbe({ name: "If-Modified-Since", status })).toEqual([
      `sw.js с устаревшим If-Modified-Since: ответ ${status} вместо 200`,
    ]);
  });
});

describe("проверка /api/", () => {
  it("404 проходит", () => {
    expect(assessApiStatus(404)).toEqual([]);
  });

  it.each([200, 502])("ответ %i – провал", (status) => {
    expect(assessApiStatus(status)).toEqual([`/api/: ответ ${status} вместо 404`]);
  });
});

describe("оценка сайта целиком", () => {
  const good = {
    files: [pageResponse(), assetResponse()],
    revalidationProbes: [
      { name: "If-None-Match", status: 200 },
      { name: "If-Modified-Since", status: 200 },
    ],
    apiStatus: 404,
  } as const;

  it("верные ответы – годен", () => {
    expect(
      assessSite({
        ...good,
        files: [...good.files],
        revalidationProbes: [...good.revalidationProbes],
      }),
    ).toEqual({ ok: true });
  });

  it("нарушение в файле, валидаторе и /api/ даёт провал со всеми причинами", () => {
    expect(
      assessSite({
        files: [pageResponse(), assetResponse({ headers: {} })],
        revalidationProbes: [
          { name: "If-None-Match", status: 304 },
          { name: "If-Modified-Since", status: 200 },
        ],
        apiStatus: 200,
      }),
    ).toEqual({
      ok: false,
      reasons: [
        "/assets/index-abc123.js: в Cache-Control нет immutable",
        "sw.js с устаревшим If-None-Match: ответ 304 вместо 200",
        "/api/: ответ 200 вместо 404",
      ],
    });
  });
});
