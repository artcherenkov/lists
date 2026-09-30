import type { Locator, Page } from "@playwright/test";

export type Point = { x: number; y: number };

/** Точки пути вниз от `start` на `distance` пикселей: `steps` равных шагов, считая последний. */
export function swipeDownPath(start: Point, distance: number, steps: number): Point[] {
  return Array.from({ length: steps }, (_, index) => ({
    x: start.x,
    y: start.y + (distance * (index + 1)) / steps,
  }));
}

type TouchType = "touchStart" | "touchMove" | "touchEnd";
type SendTouch = (type: TouchType, point?: Point) => Promise<unknown>;

/**
 * Настоящие касания через протокол браузера: Playwright сам умеет только тап без паузы.
 * Сессия открывается на время `gesture` и закрывается после него.
 */
async function withTouch(page: Page, gesture: (touch: SendTouch) => Promise<void>): Promise<void> {
  const session = await page.context().newCDPSession(page);
  try {
    await gesture((type, point) =>
      session.send("Input.dispatchTouchEvent", {
        type,
        touchPoints: point ? [{ x: point.x, y: point.y }] : [],
      }),
    );
  } finally {
    await session.detach();
  }
}

/**
 * Центр элемента, когда он остановился. Пробное наведение ждёт, пока элемент доедет:
 * шторка ещё может ехать вверх, и по её положению в этот момент жест промахнулся бы.
 */
export async function centerOf(target: Locator): Promise<Point> {
  await target.hover({ trial: true });
  const box = await target.boundingBox();
  if (!box) throw new Error("У элемента нет размеров – он не на экране");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Тап пальцем с паузой между касанием и отпусканием, как у живого пальца: так событие
 * получают и подложки. Без паузы (и у `page.touchscreen.tap`) они его не замечают.
 */
export async function fingerTap(page: Page, at: Point): Promise<void> {
  await withTouch(page, async (touch) => {
    await touch("touchStart", at);
    await page.waitForTimeout(60);
    await touch("touchEnd");
  });
}

/**
 * Свайп пальцем вниз от центра элемента. Шторка закрывается жестом, которого тап не заменит.
 *
 * Это быстрый бросок: касания идут подряд без пауз, и шторка закрывается по скорости, а не по
 * доле пройденного пути. Порог доли пути (`closeFraction`) помощник не проверяет.
 */
export async function swipeDown(page: Page, from: Locator, distance: number): Promise<void> {
  const start = await centerOf(from);
  await withTouch(page, async (touch) => {
    await touch("touchStart", start);
    for (const point of swipeDownPath(start, distance, 10)) await touch("touchMove", point);
    await touch("touchEnd");
  });
}
