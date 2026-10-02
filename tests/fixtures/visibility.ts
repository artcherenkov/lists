import type { Page } from "@playwright/test";

/**
 * Человек сворачивает приложение и возвращается. Playwright не умеет прятать страницу, поэтому
 * подменяется платформа: `document.visibilityState` и событие `visibilitychange`.
 */
export async function returnToApp(page: Page): Promise<void> {
  await page.evaluate(() => {
    const switchTo = (state: DocumentVisibilityState) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    switchTo("hidden");
    switchTo("visible");
  });
}
