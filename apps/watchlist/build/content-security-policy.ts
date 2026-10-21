import { createHash } from "node:crypto";

/** Имя плагина сборки: Storybook убирает его по имени, у него своя страница. */
export const CSP_PLUGIN_NAME = "lists:content-security-policy";

// Встроенный скрипт – без `src`; хеш браузер считает от текста между тегами как он есть.
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;

/**
 * Политика CSP страницы приложения: скрипты – только файлы сборки с нашего адреса и встроенные,
 * разрешённые хешем текста (скрипт темы в `index.html`); запросы, картинки и шрифты – только наш
 * адрес (решение 14 плана). Картинки – и `data:`: мелкие картинки сборка встраивает в код, а
 * скрипта картинка в `<img>` не запустит. Стили – и встроенные: sonner вставляет свои элементом
 * `<style>`. `frame-ancestors` в `<meta>` не действует – его должен ставить заголовок сервера; на v2
 * его пока нет, Caddy получит его вместе с сервером (веха 6, часть 5).
 */
export function contentSecurityPolicy(html: string) {
  const scriptHashes = [...html.matchAll(INLINE_SCRIPT)].map(([, text = ""]) => {
    const hash = createHash("sha256").update(text, "utf8").digest("base64");
    return `'sha256-${hash}'`;
  });
  return [
    "default-src 'self'",
    ["script-src 'self'", ...scriptHashes].join(" "),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
  ].join("; ");
}

/** Ставит политику первой в `<head>`: на то, что стоит раньше неё, она не действует. */
export function withContentSecurityPolicy(html: string) {
  if (!html.includes("<head>")) throw new Error("CSP: в странице нет <head>");
  const meta = `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(html)}" />`;
  return html.replace("<head>", `<head>\n    ${meta}`);
}
