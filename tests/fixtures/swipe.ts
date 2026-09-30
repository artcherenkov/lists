import type { Locator, Page } from "@playwright/test";

export type Point = { x: number; y: number };

/** Точки пути вниз от `start` на `distance` пикселей: `steps` равных шагов, считая последний. */
export function swipeDownPath(start: Point, distance: number, steps: number): Point[] {
  return Array.from({ length: steps }, (_, index) => ({
    x: start.x,
    y: start.y + (distance * (index + 1)) / steps,
  }));
}

/**
 * Свайп пальцем вниз от центра элемента: настоящие касания через протокол браузера.
 * Playwright сам умеет только тап, а шторка закрывается жестом, которого тап не заменит.
 *
 * Это быстрый бросок: касания идут подряд без пауз, и шторка закрывается по скорости, а не по
 * доле пройденного пути. Порог доли пути (`closeFraction`) помощник не проверяет.
 */
export async function swipeDown(page: Page, from: Locator, distance: number): Promise<void> {
  // Пробное наведение ждёт, пока элемент остановится: шторка ещё может ехать вверх,
  // и по её положению в этот момент свайп промахнулся бы.
  await from.hover({ trial: true });
  const box = await from.boundingBox();
  if (!box) throw new Error("Свайп: у элемента нет размеров – он не на экране");
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  const session = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", point?: Point) =>
    session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: point ? [{ x: point.x, y: point.y }] : [],
    });
  try {
    await touch("touchStart", start);
    for (const point of swipeDownPath(start, distance, 10)) await touch("touchMove", point);
    await touch("touchEnd");
  } finally {
    await session.detach();
  }
}
