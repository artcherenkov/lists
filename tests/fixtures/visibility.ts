import type { BrowserContext, Page } from "@playwright/test";

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

/** Человек сворачивает приложение: страница скрыта, возврата нет. Подменяется платформа, как в `returnToApp`. */
export async function moveToBackground(page: Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/**
 * Готовит контекст к `closeWithoutEvents`: перехватчики событий страницы ставятся до кода
 * приложения, иначе его собственные слушатели сработают раньше. Вызывать до первой загрузки.
 */
export async function prepareSilentClose(context: BrowserContext): Promise<void> {
  await context.addInitScript(() => {
    const swallow = (event: Event) => {
      if (Reflect.get(window, "silentClose") === true) event.stopImmediatePropagation();
    };
    window.addEventListener("pagehide", swallow, true);
    document.addEventListener("visibilitychange", swallow, true);
  });
}

/**
 * Система выгружает приложение из фона, не сказав ему об этом: страницы нет, а `pagehide` и
 * `visibilitychange` до неё не дошли, как у iPhone. Нужен `prepareSilentClose` до загрузки страницы.
 */
export async function closeWithoutEvents(page: Page): Promise<void> {
  await page.evaluate(() => Reflect.set(window, "silentClose", true));
  await page.close();
}
