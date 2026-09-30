import { expect, test } from "../../fixtures/index.ts";

// Записи в списке – подставные (apps/watchlist/src/sample): 8 штук, статусы на всех вкладках,
// во вкладке «Смотрю» ровно одна.
test("список показывает подставные записи, вкладки переключаются", async ({ page }) => {
  await page.goto("/");
  const tiles = page.getByRole("main").getByRole("listitem");

  await test.step("на вкладке «Все» видны все записи, у части есть оценка и песочные часы", async () => {
    await expect(tiles).toHaveCount(8);
    const watchedMovie = tiles.filter({ hasText: "Кольцо холмов" });
    await expect(watchedMovie).toContainText("Фильм · 2019 · Посмотрел");
    await expect(watchedMovie.getByText("8", { exact: true })).toBeVisible();
    await expect(tiles.filter({ hasText: "Тихая гавань" }).getByLabel("Жду сезон")).toBeVisible();
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

test("смена типа в фильтрах видна на кнопке, «Сбросить» её возвращает", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Фильтры" }).click();
  const filters = page.getByRole("dialog", { name: "Фильтры списка" });
  await expect(filters.getByRole("button", { name: "Сбросить" })).toBeDisabled();

  await filters.getByText("Сериалы", { exact: true }).click();
  await expect(page.getByRole("button", { name: "Фильтры · 1" })).toBeVisible();

  await filters.getByRole("button", { name: "Сбросить" }).click();
  await expect(page.getByRole("button", { name: "Фильтры", exact: true })).toBeVisible();
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
