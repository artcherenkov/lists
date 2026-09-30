import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../../fixtures/index.ts";

// Ждёт, пока элемент перестанет двигаться (тост въезжает с анимацией), и возвращает его рамку.
async function settledBox(locator: Locator) {
  let previous: { x: number; y: number; width: number; height: number } | null = null;
  await expect
    .poll(
      async () => {
        const box = await locator.boundingBox();
        const isSettled = JSON.stringify(box) === JSON.stringify(previous);
        previous = box;
        return box !== null && isSettled;
      },
      { intervals: [100] },
    )
    .toBe(true);
  return previous!;
}

// Записи в списке – подставные (apps/watchlist/src/sample): 8 штук, статусы на всех вкладках,
// во вкладке «Смотрю» ровно одна.
test("список показывает подставные записи, вкладки переключаются", async ({ page }) => {
  await page.goto("/");
  const tiles = page.getByRole("main").getByRole("listitem");

  await test.step("на вкладке «Все» видны все записи, у части есть оценка и песочные часы", async () => {
    await expect(tiles).toHaveCount(8);
    const watchedMovie = tiles.filter({ hasText: "Кольцо холмов" });
    await expect(watchedMovie).toContainText("Фильм · 2019 · Посмотрел");
    await expect(watchedMovie.getByText("Оценка: 8", { exact: true })).toBeVisible();
    await expect(watchedMovie.getByRole("button")).toHaveAccessibleName(/Оценка: 8/);
    await expect(
      tiles.filter({ hasText: "Тихая гавань" }).getByRole("img", { name: "Жду сезон" }),
    ).toBeVisible();
  });

  await test.step("вкладка «Хочу» оставляет только записи со статусом «Хочу»", async () => {
    await page.getByRole("tab", { name: "Хочу" }).click();

    await expect(tiles).toHaveCount(3);
    await expect(tiles.filter({ hasText: "Ночной экспресс" })).toBeVisible();
    await expect(tiles.filter({ hasText: "Северный свет" })).toHaveCount(0);
  });

  await test.step("вкладка «Посмотрел» показывает просмотренное", async () => {
    await page.getByRole("tab", { name: "Посмотрел" }).click();

    await expect(tiles).toHaveCount(3);
    await expect(tiles.filter({ hasText: "Долгая осень" })).toBeVisible();
  });
});

test("пустая вкладка показывает «Пока пусто»", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Смотрю" }).click();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(1);

  await test.step("единственная запись «Смотрю» переходит в «Хочу»", async () => {
    await page.getByRole("button", { name: "Северный свет" }).click();
    const card = page.getByRole("dialog", { name: "Изменить" });
    await card.getByRole("combobox", { name: "Статус" }).click();
    await page.getByRole("option", { name: "Хочу" }).click();
    await card.getByRole("button", { name: "Готово" }).click();
    await expect(card).toBeHidden();
  });

  await expect(page.getByText("Пока пусто")).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem")).toHaveCount(0);
});

test("окно фильтров открывается и показывает «Найдено»", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Хочу" }).click();

  await page.getByRole("button", { name: "Фильтры" }).click();

  const filters = page.getByRole("dialog", { name: "Фильтры списка" });
  await expect(filters.getByRole("status")).toHaveText("Найдено: 3");
});

test("окно фильтров целиком помещается на экране, прижатое к правому краю значка", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Фильтры" });
  await trigger.click();

  const filters = page.getByRole("dialog", { name: "Фильтры списка" });
  const box = await settledBox(filters);
  const triggerBox = (await trigger.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.x + box.width).toBeCloseTo(triggerBox.x + triggerBox.width, 0);
});

// Тост падает сверху по центру, высота шапки подобрана под него. Проверяем тост с названием
// в одну строку. В две строки он тоже не доходит до ряда (запас 3 px на 375 и 393 px); ряд
// накрывает только тост в три строки (замер на названии в 65 знаков), на 375 и 393 px.
test("тост об удалении с названием в одну строку не накрывает вкладки и значок фильтров", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("main")
    .getByRole("button", { name: /Ночной экспресс/ })
    .click();
  await page
    .getByRole("dialog", { name: "Изменить" })
    .getByRole("button", { name: "Удалить" })
    .click();

  const toast = page.getByRole("listitem").filter({ hasText: "«Ночной экспресс» удалён" });
  await expect(toast).toBeVisible();
  const toastBox = await settledBox(toast);

  const toastBottom = toastBox.y + toastBox.height;
  const tabsBox = (await page.getByRole("tablist").boundingBox())!;
  // Вкладки и значок фильтров стоят в одном ряду, верх у них общий.
  expect(toastBottom).toBeLessThanOrEqual(tabsBox.y);
});

test("смена типа в фильтрах видна на кнопке, «Сбросить» её возвращает", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Фильтры" }).click();
  const filters = page.getByRole("dialog", { name: "Фильтры списка" });
  await expect(filters.getByRole("button", { name: "Сбросить" })).toBeDisabled();

  await filters.getByText("Сериалы", { exact: true }).click();
  const filtersButton = page.getByRole("button", { name: "Фильтры · 1" });
  await expect(filtersButton).toBeVisible();
  // Имя кнопки слышит скринридер, а глаз видит число в кружке: оно под aria-hidden.
  await expect(filtersButton.getByText("1", { exact: true })).toBeVisible();

  await filters.getByRole("button", { name: "Сбросить" }).click();
  const resetButton = page.getByRole("button", { name: "Фильтры", exact: true });
  await expect(resetButton).toBeVisible();
  await expect(resetButton.getByText("1", { exact: true })).toHaveCount(0);
});

test("сдвиг ползунков оценки меняет диапазон в заголовке группы", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Фильтры" }).click();
  const filters = page.getByRole("dialog", { name: "Фильтры списка" });
  const rating = filters.getByRole("group", { name: "Моя оценка" });
  const [minThumb, maxThumb] = await rating.getByRole("slider").all();

  await test.step("вначале виден весь диапазон", async () => {
    await expect(rating.getByText("1–10", { exact: true })).toBeVisible();
  });

  await test.step("сдвиг обоих ползунков сужает диапазон", async () => {
    await minThumb!.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await maxThumb!.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(rating.getByText("3–9", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Фильтры · 1" })).toBeVisible();
  });

  await test.step("когда края совпали, вместо диапазона одно число", async () => {
    await minThumb!.focus();
    await page.keyboard.press("Shift+ArrowRight");
    await expect(rating.getByText("9", { exact: true })).toBeVisible();
  });

  await test.step("«Сбросить» возвращает весь диапазон", async () => {
    await filters.getByRole("button", { name: "Сбросить" }).click();
    await expect(rating.getByText("1–10", { exact: true })).toBeVisible();
  });
});

// Ряд вкладок и значка фильтров имеет два размера по ширине экрана: до 384 px штатный vega
// (36 px), шире – крупный (40 px). Проверяем и саму высоту, и что четыре вкладки помещаются:
// высоту дорожки легко молча сломать при обновлении shadcn, а на узком экране текст крупного
// размера уже не помещается.
const rowSizes = (page: Page) => ({
  track: page.getByRole("tablist"),
  filters: page.getByRole("button", { name: "Фильтры" }),
});

test.describe("на узком экране 375 px (iPhone SE, mini)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("дорожка вкладок и значок фильтров по 36 px", async ({ page }) => {
    await page.goto("/");
    const { track, filters } = rowSizes(page);

    expect((await track.boundingBox())!.height).toBe(36);
    const filtersBox = (await filters.boundingBox())!;
    expect([filtersBox.width, filtersBox.height]).toEqual([36, 36]);
  });

  test("четыре вкладки помещаются в дорожку с отступом по краям", async ({ page }) => {
    await page.goto("/");
    const list = (await page.getByRole("tablist").boundingBox())!;
    const tabs = await page.getByRole("tab").all();
    expect(tabs).toHaveLength(4);

    // Отступ дорожки – 3 px; допуск на дробные ширины.
    const trackPadding = 3 - 0.1;
    for (const tab of tabs) {
      const box = (await tab.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(list.x + trackPadding);
      expect(box.x + box.width).toBeLessThanOrEqual(list.x + list.width - trackPadding);
    }
  });
});

test("на экране шире 384 px дорожка вкладок и значок фильтров по 40 px", async ({ page }) => {
  await page.goto("/");
  const { track, filters } = rowSizes(page);

  expect((await track.boundingBox())!.height).toBe(40);
  const filtersBox = (await filters.boundingBox())!;
  expect([filtersBox.width, filtersBox.height]).toEqual([40, 40]);
});
