import { expect, test } from "../../fixtures/index.ts";

// Поиск идёт по подставному каталогу (apps/watchlist/src/sample/sample-catalog.ts).
// Не покрыто, пока поиск не идёт через сервер: отмена устаревшего запроса и «Поиск не ответил».
// У подставного поиска задержка постоянная, а сбой не вызвать без скрытого переключателя
// в продукте. Вернуться, когда поиск пойдёт через сервер и его ответы можно будет подменить.
test("«+» открывает шторку добавления с фокусом в поле поиска", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Добавить" }).click();

  await expect(page.getByRole("dialog", { name: "Добавить" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Поиск" })).toBeFocused();
});

test("выбор результата поиска добавляет запись на вкладку «Хочу»", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });

  await test.step("запрос показывает подходящие результаты и пункт ручного ввода с набранным запросом", async () => {
    await page.getByRole("textbox", { name: "Поиск" }).fill("Звёздный");

    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Звёздная пыль севера/ })).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: /Звёздный.*Добавить вручную/ })).toBeVisible();
  });

  await test.step("выбор результата закрывает шторку, запись появляется на вкладке «Хочу»", async () => {
    await sheet.getByRole("button", { name: /Звёздный ветер/ }).click();

    await expect(sheet).toBeHidden();
    await expect(page.getByRole("tab", { name: "Хочу" })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("button", { name: /Звёздный ветер/ })).toContainText(
      "Фильм · 2022 · Хочу",
    );
  });
});

// Панель остаётся в DOM 500 мс, пока шторка закрывается: второй тап попадает в неё же.
// Playwright `dblclick` здесь не годится: пока идёт второй клик, панель уже уезжает вниз
// и он попадает в подложку. Два события `click` подряд на том же элементе – как тап,
// пришедший до того, как панель сдвинулась.
test("двойное нажатие на результат добавляет одну запись", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });
  await page.getByRole("textbox", { name: "Поиск" }).fill("Звёздный");
  const result = sheet.getByRole("button", { name: /Звёздный ветер/ });

  await result.dispatchEvent("click");
  await result.dispatchEvent("click");

  await expect(sheet).toBeHidden();
  await expect(page.getByRole("main").getByRole("button", { name: /Звёздный ветер/ })).toHaveCount(
    1,
  );
});

test("запись без варианта в поиске заводится руками: название и тип", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });

  await test.step("пункт «Добавить вручную» переносит запрос в поле названия", async () => {
    await page.getByRole("textbox", { name: "Поиск" }).fill("Неведомое кино");
    await sheet.getByRole("button", { name: /Неведомое кино.*Добавить вручную/ }).click();

    await expect(sheet.getByLabel("Название")).toHaveValue("Неведомое кино");
    await expect(sheet.getByRole("radio", { name: "Фильм" })).toBeChecked();
  });

  await test.step("название и тип правятся, «Добавить» заводит запись", async () => {
    await sheet.getByLabel("Название").fill("Неведомый сериал");
    await sheet.getByText("Сериал", { exact: true }).click();
    await sheet.getByRole("button", { name: "Добавить" }).click();

    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: /Неведомый сериал/ })).toContainText(
      "Сериал · Хочу",
    );
  });
});

test("«Вернуться к поиску» из ручного ввода возвращает поле поиска", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });
  await page.getByRole("textbox", { name: "Поиск" }).fill("Неведомое кино");
  await sheet.getByRole("button", { name: /Неведомое кино.*Добавить вручную/ }).click();

  await sheet.getByRole("button", { name: "Вернуться к поиску" }).click();

  await expect(page.getByRole("textbox", { name: "Поиск" })).toBeVisible();
});

// Задержки: поиск стартует через 300 мс после последней буквы, подставной каталог отвечает
// ещё через 250 мс. Часы остановлены, поэтому тест сам решает, сколько времени прошло.
test("поиск стартует через 300 мс после последней буквы, а не после первой", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });
  const search = page.getByRole("textbox", { name: "Поиск" });
  await expect(search).toBeFocused();
  await clock.freeze();

  await test.step("пока запрос набирается, вместо результатов – «Ищу…»", async () => {
    await search.fill("Зв");
    await clock.advance(200);
    await search.fill("Звёздный");

    await expect(sheet.getByText("Ищу…")).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toHaveCount(0);
  });

  await test.step("через 400 мс после второй правки запрос ушёл, но ответа ещё нет", async () => {
    await clock.advance(400);

    await expect(sheet.getByText("Ищу…")).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toHaveCount(0);
  });

  await test.step("ответ каталога показывает результаты", async () => {
    await clock.advance(200);

    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toBeVisible();
    await expect(sheet.getByText("Ищу…")).toHaveCount(0);
  });
});

test("один символ поиска не запускает, а прежние результаты пропадают", async ({ page, clock }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить" }).click();
  const sheet = page.getByRole("dialog", { name: "Добавить" });
  const search = page.getByRole("textbox", { name: "Поиск" });
  await expect(search).toBeFocused();
  await clock.freeze();

  await test.step("один символ – ни «Ищу…», ни результатов, даже когда время вышло", async () => {
    await search.fill("З");
    await clock.advance(1000);

    await expect(sheet.getByText("Ищу…")).toHaveCount(0);
    await expect(sheet.getByRole("button", { name: /Добавить вручную/ })).toHaveCount(0);
  });

  await test.step("результаты прошлого запроса не возвращаются после короткого", async () => {
    await search.fill("Звёздный");
    await clock.advance(1000);
    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toBeVisible();

    await search.fill("З");
    await search.fill("Го");

    await expect(sheet.getByText("Ищу…")).toBeVisible();
    await expect(sheet.getByRole("button", { name: /Звёздный ветер/ })).toHaveCount(0);
  });
});
