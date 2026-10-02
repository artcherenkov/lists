import type { Page } from "@playwright/test";

/**
 * Ждёт, пока service worker станет активным: к этому моменту он уже скачал сборку целиком. Без
 * worker (по умолчанию он заблокирован) ожидание длится до таймаута теста.
 */
export async function waitForServiceWorker(page: Page): Promise<void> {
  await page.evaluate(() => navigator.serviceWorker.ready);
}
