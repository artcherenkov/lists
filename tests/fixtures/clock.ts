import type { Page } from "@playwright/test";

// Часы страницы. До `freeze` идут сами (шторка успевает выехать), после – только `advance`:
// паузы приложения проверяются без `waitForTimeout`.
export type PageClock = {
  /**
   * Остановить часы: дальше время идёт только через `advance`. Кадры анимации, которые уже
   * стояли в очереди (выезд шторки), успевают выполниться.
   */
  freeze: () => Promise<void>;
  advance: (ms: number) => Promise<void>;
};

const start = new Date("2026-01-01T10:00:00");
// Остановка – это прыжок к этой точке; часы не дойдут до неё сами за время теста.
const freezeAt = new Date("2026-01-01T11:00:00");

/** Ставит часы до первого `goto`: страница с самого начала живёт на них. */
export async function installPageClock(page: Page): Promise<PageClock> {
  await page.clock.install({ time: start });
  return {
    freeze: async () => {
      await page.clock.pauseAt(freezeAt);
      await page.clock.runFor(100);
    },
    advance: (ms) => page.clock.runFor(ms),
  };
}
