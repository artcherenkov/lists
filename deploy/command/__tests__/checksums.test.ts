import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { computeChecksums, formatChecksums, parseChecksums, sitePath } from "../checksums.ts";

// Известные значения: sha256("hello") и sha256("") из спецификации алгоритма.
const HELLO = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";
const EMPTY = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

describe("файл SHA256SUMS", () => {
  it("записывается в формате sha256sum, по порядку путей", () => {
    expect(
      formatChecksums([
        { path: "site/sw.js", sha256: EMPTY },
        { path: "site/assets/app.js", sha256: HELLO },
      ]),
    ).toBe(`${HELLO}  site/assets/app.js\n${EMPTY}  site/sw.js\n`);
  });

  it("читается обратно в записи, путь на сайте – без префикса site/", () => {
    const entries = parseChecksums(`${HELLO}  site/assets/app.js\n${EMPTY}  site/sw.js\n`);
    expect(entries).toEqual([
      { path: "site/assets/app.js", sha256: HELLO },
      { path: "site/sw.js", sha256: EMPTY },
    ]);
    expect(entries.map(sitePath)).toEqual(["assets/app.js", "sw.js"]);
  });

  it("пустой файл – ошибка", () => {
    expect(() => parseChecksums("")).toThrow(/пуст/);
  });

  it.each([
    "не строка",
    `${HELLO} site/one-space.js`,
    `${HELLO}  Caddyfile`,
    `${HELLO.slice(1)}  site/short.js`,
  ])("строка «%s» вне формата – ошибка", (line) => {
    expect(() => parseChecksums(`${line}\n`)).toThrow(/не в формате/);
  });
});

describe("суммы каталога сборки", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "lists-checksums-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("считает суммы вложенных файлов с путями от site/", async () => {
    mkdirSync(join(dir, "site", "assets"), { recursive: true });
    writeFileSync(join(dir, "site", "assets", "app.js"), "hello");
    writeFileSync(join(dir, "site", "index.html"), "");

    const entries = await computeChecksums(join(dir, "site"));

    expect(formatChecksums(entries)).toBe(
      `${HELLO}  site/assets/app.js\n${EMPTY}  site/index.html\n`,
    );
  });
});
