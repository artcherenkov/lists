import type { Page } from "@playwright/test";

import { expect, swipeDown, test } from "../../fixtures/index.ts";

// Статус в карточке – выпадающий список. Его пункты выходят порталом за пределы шторки,
// поэтому ищем их по странице, а не внутри карточки.
const statusSelect = (page: Page) =>
  page.getByRole("dialog", { name: "Изменить" }).getByRole("combobox", { name: "Статус" });
const statusOption = (page: Page, name: string) => page.getByRole("option", { name });

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
    await expect(statusSelect(page)).toContainText("Хочу");
  });

  await test.step("после выбора статуса и «Готово» подзаголовок плитки обновлён", async () => {
    await statusSelect(page).click();
    await statusOption(page, "Смотрю").click();
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
  await statusSelect(page).click();
  await expect(statusOption(page, "Жду сезон")).toBeVisible();
  await page.keyboard.press("Escape");
  await card.getByRole("button", { name: "Готово" }).click();
  await expect(card).toBeHidden();

  await page.getByRole("button", { name: /Ночной экспресс/ }).click();
  await statusSelect(page).click();
  await expect(statusOption(page, "Смотрю")).toBeVisible();
  await expect(statusOption(page, "Жду сезон")).toHaveCount(0);
});

test("у записи без каталога в карточке правятся название и тип", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Домашнее видео 1994/ }).click();
  await expect(card.getByLabel("Название")).toHaveValue("Домашнее видео 1994");

  await test.step("тип уходит сразу, по клику", async () => {
    await card.getByText("Сериал", { exact: true }).click();

    await statusSelect(page).click();
    await expect(statusOption(page, "Жду сезон")).toBeVisible();
    await page.keyboard.press("Escape");
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

// «Тихая гавань» – сериал из каталога со статусом «Жду сезон».
test("у сериала со статусом «Жду сезон» он выбран в списке статусов", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Тихая гавань/ }).click();

  await expect(statusSelect(page)).toContainText("Жду сезон");
});

// Шторка слушает Escape на window, меню – на документе. Escape при открытом списке статусов
// должен закрыть только список, а следующий Escape – саму карточку.
test("Escape закрывает сначала список статусов, потом карточку", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Ночной экспресс/ }).click();
  await statusSelect(page).click();
  await expect(statusOption(page, "Смотрю")).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(statusOption(page, "Смотрю")).toHaveCount(0);
  await expect(card).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(card).toBeHidden();
});

// Невидимая подложка списка (Base UI) должна лежать над подложкой шторки: иначе тап мимо списка
// доходил бы до шторки и закрывал её вместе со списком. Точка (196, 40) – затемнённая подложка
// над шторкой на экране 393 px.
test("тап мимо списка статусов закрывает только список", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  await page.getByRole("button", { name: /Ночной экспресс/ }).click();
  await expect(card).toBeVisible();

  // Тап с паузой между касанием и отпусканием, как у пальца: так подложка шторки получает
  // событие. Без паузы (и у `page.touchscreen.tap`) тест проходил бы даже без исправления.
  const session = await page.context().newCDPSession(page);
  const fingerTap = async (x: number, y: number) => {
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await page.waitForTimeout(60);
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  try {
    // Пробное наведение ждёт, пока шторка доедет вверх: по её положению в пути тап промахнулся бы.
    await statusSelect(page).hover({ trial: true });
    const trigger = await statusSelect(page).boundingBox();
    if (!trigger) throw new Error("У списка статусов нет размеров – он не на экране");
    await fingerTap(trigger.x + trigger.width / 2, trigger.y + trigger.height / 2);
    await expect(statusOption(page, "Смотрю")).toBeVisible();

    await fingerTap(196, 40);
  } finally {
    await session.detach();
  }

  await expect(statusOption(page, "Смотрю")).toHaveCount(0);
  await page.waitForTimeout(700);
  await expect(card).toBeVisible();
  await expect(statusSelect(page)).toBeVisible();
});

// Пункты списка рендерятся порталом, а события React всплывают через порталы: без проверки
// источника жест, начатый на пункте, попадал бы в обработчики панели и тянул шторку вниз.
test("свайп вниз по пункту списка статусов не тянет и не закрывает карточку", async ({ page }) => {
  await page.goto("/");
  const card = page.getByRole("dialog", { name: "Изменить" });
  const panel = card.locator(":scope > div").last();
  await page.getByRole("button", { name: /Ночной экспресс/ }).click();
  await statusSelect(page).hover({ trial: true });
  await statusSelect(page).click();
  await expect(statusOption(page, "Смотрю")).toBeVisible();
  const topBefore = (await panel.boundingBox())?.y;

  await swipeDown(page, statusOption(page, "Смотрю"), 450);
  // Шторке, если бы она поехала, нужно время, чтобы доехать вниз.
  await page.waitForTimeout(700);

  await expect(card).toBeVisible();
  expect((await panel.boundingBox())?.y).toBe(topBefore);
});
