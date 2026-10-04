import type { Page } from "@playwright/test";

/**
 * Буфер обмена недоступен, как на странице по http или при отказе пользователя. Подменяется
 * платформа, а не код приложения: `navigator.clipboard` исчезает (`missing`) или отклоняет
 * запись так же, как браузер при запрете (`refuses`).
 */
export async function breakClipboard(page: Page, how: "missing" | "refuses"): Promise<void> {
  await page.evaluate((mode) => {
    if (mode === "missing") {
      Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
      return;
    }
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: () => Promise.reject(new DOMException("Запись в буфер запрещена", "NotAllowedError")),
    });
  }, how);
}

/** Буфер обмена снова работает: подмена `breakClipboard` снята. */
export async function mendClipboard(page: Page): Promise<void> {
  await page.evaluate(() => {
    Reflect.deleteProperty(navigator, "clipboard");
    Reflect.deleteProperty(navigator.clipboard, "writeText");
  });
}

/** Текст, который лежит в буфере обмена; нужны разрешения `clipboard-read` и `clipboard-write`. */
export function readClipboard(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}
