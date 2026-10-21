import { describe, expect, it } from "vitest";

import { withContentSecurityPolicy } from "../content-security-policy.ts";

const THEME_SCRIPT = '(() => document.documentElement.classList.add("dark"))();';
// Хеш посчитан отдельно: printf '%s' "$THEME_SCRIPT" | openssl dgst -sha256 -binary | base64
const THEME_SCRIPT_HASH = "'sha256-lTeo9ewdnvN1S2FFB/0YbsyCKJUtrMvSWvCOmOE6Xyo='";

const PAGE = [
  "<!doctype html>",
  "<html>",
  "  <head>",
  `    <script>${THEME_SCRIPT}</script>`,
  '    <script type="module" crossorigin src="/assets/index-abc.js"></script>',
  "  </head>",
  "  <body></body>",
  "</html>",
].join("\n");

function policyOf(html: string) {
  return /<meta http-equiv="Content-Security-Policy" content="([^"]*)"/.exec(html)?.[1];
}

describe("политика CSP страницы", () => {
  it("встроенный скрипт разрешён хешем своего текста, файлы сборки – нашим адресом", () => {
    const policy = policyOf(withContentSecurityPolicy(PAGE));

    expect(policy).toContain(`script-src 'self' ${THEME_SCRIPT_HASH};`);
    expect(policy).toContain("default-src 'self';");
    expect(policy).toContain("object-src 'none';");
  });

  it("изменённый встроенный скрипт – другой хеш: прежний его не разрешит", () => {
    const changed = PAGE.replace('"dark"', '"light"');

    expect(policyOf(withContentSecurityPolicy(changed))).not.toContain(THEME_SCRIPT_HASH);
  });

  it("политика – первый элемент head, раньше встроенного скрипта", () => {
    const html = withContentSecurityPolicy(PAGE);

    expect(html.indexOf("Content-Security-Policy")).toBeGreaterThan(html.indexOf("<head>"));
    expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<script>"));
  });

  it("страница без head – ошибка сборки, а не страница без политики", () => {
    expect(() => withContentSecurityPolicy("<html><body></body></html>")).toThrow(
      "CSP: в странице нет <head>",
    );
  });
});
