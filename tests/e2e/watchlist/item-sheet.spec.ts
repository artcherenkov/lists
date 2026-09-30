import { expect, swipeDown, test } from "../../fixtures/index.ts";

// Записи – подставные (apps/watchlist/src/sample): «Ночной экспресс» – фильм из каталога со
// статусом «Хочу», «Северный свет» – сериал, «Домашнее видео 1994» – запись, заведённая руками.
test("карточка открывается по плитке, смена статуса видна в подзаголовке плитки", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });

  await test.step("плитка открывает карточку с постером, типом и статусом записи", async () => {
    await page.getByRole("button", { name: /Ночной экспресс/ }).click();

    await expect(card.getByText("Ночной экспресс")).toBeVisible();
    await expect(card.getByText("Фильм · 2023")).toBeVisible();
    await expect(card.getByRole("radio", { name: "Хочу" })).toBeChecked();
  });

  await test.step("после выбора статуса и «Готово» подзаголовок плитки обновлён", async () => {
    await card.getByText("Смотрю", { exact: true }).click();
    await card.getByRole("button", { name: "Готово" }).click();

    await expect(card).toBeHidden();
    await expect(page.getByRole("button", { name: /Ночной экспресс/ })).toContainText(
      "Фильм · 2023 · Смотрю",
    );
  });
});

test("«Жду сезон» предлагается сериалу и не предлагается фильму", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });

  await page.getByRole("button", { name: /Северный свет/ }).click();
  await expect(card.getByRole("radio", { name: "Жду сезон" })).toBeAttached();
  await card.getByRole("button", { name: "Готово" }).click();
  await expect(card).toBeHidden();

  await page.getByRole("button", { name: /Ночной экспресс/ }).click();
  await expect(card.getByRole("radio", { name: "Смотрю" })).toBeAttached();
  await expect(card.getByRole("radio", { name: "Жду сезон" })).toHaveCount(0);
});

test("у записи без каталога в карточке правятся название и тип", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Домашнее видео 1994/ }).click();
  await expect(card.getByLabel("Название")).toHaveValue("Домашнее видео 1994");

  await test.step("тип уходит сразу, по клику", async () => {
    await card.getByText("Сериал", { exact: true }).click();

    await expect(card.getByRole("radio", { name: "Жду сезон" })).toBeAttached();
  });

  await test.step("«Готово» сразу после правки названия не теряет его", async () => {
    await card.getByLabel("Название").fill("Семейный архив");
    await card.getByRole("button", { name: "Готово" }).click();

    await expect(card).toBeHidden();
    await expect(page.getByRole("button", { name: /Семейный архив/ })).toContainText(
      "Сериал · Хочу",
    );
  });
});

test("«Удалить» закрывает карточку, тост с «Отменить» возвращает запись", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  const tile = page.getByRole("main").getByRole("button", { name: /Ночной экспресс/ });
  await tile.click();

  await test.step("удаление закрывает карточку, запись пропадает из списка", async () => {
    await card.getByRole("button", { name: "Удалить" }).click();

    await expect(card).toBeHidden();
    await expect(tile).toHaveCount(0);
  });

  await test.step("«Отменить» в тосте возвращает запись на место", async () => {
    await expect(page.getByText("«Ночной экспресс» удалён")).toBeVisible();
    await page.getByRole("button", { name: "Отменить" }).click();

    await expect(tile).toBeVisible();
  });
});

// Найденная при ревью ошибка: название, набранное перед «Удалить», должно отбрасываться, но
// «Готово» (или подложка, свайп), нажатое, пока шторка едет вниз, досылает его удалённой записи,
// и «Отменить» возвращает запись с чужой правкой. Шторка остаётся в DOM 500 мс закрытия, поэтому
// нажатие возможно; `dispatchEvent` – как тап, пришедший до того, как панель сдвинулась.
test("«Удалить» отбрасывает ещё не отданное название: «Готово» во время закрытия его не досылает", async ({
  page,
}) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Домашнее видео 1994/ }).click();
  // Пробное нажатие ждёт, пока шторка доедет вверх: иначе пауза до обычного `click` дольше
  // 400 мс, и название уходит само, ещё до «Удалить».
  await card.getByRole("button", { name: "Удалить" }).click({ trial: true });
  await card.getByLabel("Название").fill("Правка перед удалением");

  await card.getByRole("button", { name: "Удалить" }).dispatchEvent("click");
  await card.getByRole("button", { name: "Готово" }).dispatchEvent("click");
  await expect(card).toBeHidden();
  await page.getByRole("button", { name: "Отменить" }).click();

  const main = page.getByRole("main");
  await expect(main.getByRole("button", { name: /Домашнее видео 1994/ })).toBeVisible();
  await expect(main.getByRole("button", { name: /Правка перед удалением/ })).toHaveCount(0);
});

// Название ручной записи уходит наружу через 400 мс после последней правки. Увидеть это можно
// по плитке за шторкой: список обновляется, не дожидаясь «Готово».
test("название ручной записи уходит само через 400 мс после последней правки", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Домашнее видео 1994/ }).click();
  const title = card.getByLabel("Название");
  await expect(title).toBeVisible();
  await clock.freeze();
  const main = page.getByRole("main");

  await test.step("пока правка не устоялась, плитка не меняется", async () => {
    await title.fill("Первая правка");
    await clock.advance(200);
    await title.fill("Вторая правка");
    await clock.advance(300);

    await expect(main.getByRole("button", { name: /Домашнее видео 1994/ })).toBeVisible();
  });

  await test.step("через 400 мс после последней правки плитка получает последнее название", async () => {
    await clock.advance(100);

    await expect(main.getByRole("button", { name: /Вторая правка/ })).toBeVisible();
    await expect(main.getByRole("button", { name: /Первая правка/ })).toHaveCount(0);
  });
});

test("свайп вниз закрывает карточку и досылает название", async ({ page, clock }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Домашнее видео 1994/ }).click();
  const title = card.getByLabel("Название");
  await expect(title).toBeVisible();
  await clock.freeze();
  await title.fill("Правка перед свайпом");

  await swipeDown(page, card.getByText("Название", { exact: true }), 450);
  await clock.advance(600);

  await expect(card).toBeHidden();
  await expect(
    page.getByRole("main").getByRole("button", { name: /Правка перед свайпом/ }),
  ).toBeVisible();
});
