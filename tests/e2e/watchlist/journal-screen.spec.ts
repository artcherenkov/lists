import type { Page } from "@playwright/test";

import {
  breakClipboard,
  expect,
  journalLine,
  mendClipboard,
  openJournal,
  readClipboard,
  returnToApp,
  swipeDown,
  test,
} from "../../fixtures/index.ts";

const WARM_RETURN = "visibilitychange: страница снова видна, тёплый возврат, в фоне 0 с";
const COPY_FAILED_NOTE = "Не удалось скопировать: текст выделен, скопируйте его вручную";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

/** Журнал, в котором записей больше, чем влезает в шторку: каждый возврат пишет две строки. */
async function fillJournal(page: Page) {
  for (let i = 0; i < 40; i++) await returnToApp(page);
}

/** Текст, который человек получил бы, выделив все записи журнала пальцем или мышью. */
function selectedText(page: Page) {
  return page.evaluate(() => getSelection()?.toString());
}

async function selectAllRecords(page: Page) {
  await page.getByTestId("journal-log").evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    getSelection()?.removeAllRanges();
    getSelection()?.addRange(range);
  });
}

test("строка «Журнал приложения» в профиле открывает журнал в той же шторке, «‹ Профиль» возвращает к профилю", async ({
  page,
}) => {
  await page.goto("/");
  const { sheet, log } = await openJournal(page);

  await test.step("журнал показывает заголовок, кнопку назад и первую строку копии", async () => {
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Журнал", exact: true })).toBeVisible();
    await expect(log.getByText(/^Журнал приложения, версия \S/)).toBeVisible();
  });

  await test.step("«‹ Профиль» возвращает к профилю", async () => {
    await sheet.getByRole("button", { name: "Профиль" }).click();

    const profile = page.getByRole("dialog", { name: "Профиль" });
    await expect(profile.getByRole("definition")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });
});

test("журнал открывается прокрученным к концу: свежие записи внизу", async ({ page }) => {
  await page.goto("/");
  await fillJournal(page);

  const { log } = await openJournal(page);

  await expect(log.getByText(journalLine(WARM_RETURN)).last()).toBeInViewport();
  await expect(log.getByText(/^Журнал приложения, версия/)).not.toBeInViewport();
});

test("запись, пришедшая при открытом журнале, видна внизу, если читатель был у конца", async ({
  page,
}) => {
  await page.goto("/");
  await fillJournal(page);
  const { log } = await openJournal(page);
  const lastLine = log.getByText(journalLine("visibilitychange: страница скрыта")).last();
  await expect(lastLine).toBeInViewport();

  await returnToApp(page);

  await expect(log.getByText(journalLine(WARM_RETURN)).last()).toBeInViewport();
});

test("запись, пришедшая при открытом журнале, не сдвигает прокрутку, если читатель ушёл вверх", async ({
  page,
}) => {
  await page.goto("/");
  await fillJournal(page);
  const { log } = await openJournal(page);
  const header = log.getByText(/^Журнал приложения, версия/);
  await log.getByText(journalLine(WARM_RETURN)).last().hover();
  await page.mouse.wheel(0, -100_000);
  await expect(header).toBeInViewport();

  await returnToApp(page);

  await expect(header).toBeInViewport();
});

test("«Скопировать журнал» кладёт в буфер копию с версией, числом записей и userAgent, кнопка отвечает «Скопировано · N» и возвращается", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const { sheet, appVersion } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  await clock.freeze();
  const userAgent = await page.evaluate(() => navigator.userAgent);

  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();

  const copied = sheet.getByRole("button", { name: /^Скопировано · \d+$/ });
  await expect(copied).toBeVisible();
  const copy = await readClipboard(page);
  const [header, ...records] = copy.split("\n");
  expect(header).toContain(`версия ${appVersion},`);
  expect(header).toContain(`записей ${records.length},`);
  expect(header).toContain(`userAgent ${userAgent}`);
  await expect(copied).toHaveAccessibleName(`Скопировано · ${records.length}`);

  await test.step("надпись возвращается через 2,5 с", async () => {
    await clock.advance(2400);
    await expect(copied).toBeVisible();

    await clock.advance(200);

    await expect(sheet.getByRole("button", { name: "Скопировать журнал" })).toBeVisible();
  });

  await test.step("выделение записей руками даёт ту же копию", async () => {
    await selectAllRecords(page);

    expect(await selectedText(page)).toBe(copy);
  });
});

for (const how of ["refuses", "missing"] as const) {
  test(`буфер обмена недоступен (${how === "missing" ? "нет API" : "отказ"}): текст журнала выделен, под кнопками подпись про ручное копирование`, async ({
    page,
  }) => {
    await page.goto("/");
    const { sheet, log } = await openJournal(page);
    await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
    await breakClipboard(page, how);

    await sheet.getByRole("button", { name: "Скопировать журнал" }).click();

    await expect(sheet.getByText(COPY_FAILED_NOTE, { exact: true })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Скопировать журнал" })).toBeVisible();
    const selection = await selectedText(page);
    expect(selection).toBe(await log.innerText());
    expect(selection).toMatch(/^Журнал приложения, версия \S/);

    await sheet.getByRole("button", { name: "Очистить" }).click();
    await sheet.getByRole("button", { name: "Точно?" }).click();

    await expect(sheet.getByText(COPY_FAILED_NOTE, { exact: true })).toBeHidden();
  });
}

test("буфер обмена недоступен, а человек уже выделил часть текста: «Скопировать журнал» выделяет весь журнал", async ({
  page,
}) => {
  await page.goto("/");
  const { sheet, log } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  await log.getByText(journalLine(/Запуск: версия /)).dblclick();
  const partial = await selectedText(page);
  expect(partial).toMatch(/\S/);
  expect(partial).not.toBe(await log.innerText());
  await breakClipboard(page, "refuses");

  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();

  await expect(sheet.getByText(COPY_FAILED_NOTE, { exact: true })).toBeVisible();
  expect(await selectedText(page)).toBe(await log.innerText());
});

test("повторное копирование продлевает надпись «Скопировано · N» на 2,5 с от последнего нажатия", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const { sheet } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  await clock.freeze();
  const copied = sheet.getByRole("button", { name: /^Скопировано · \d+$/ });

  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();
  await expect(copied).toBeVisible();
  await clock.advance(2000);
  await copied.click();
  // Ответ буфера приходит в реальном времени: таймер надписи ставится после него.
  await readClipboard(page);
  await clock.advance(1000);

  await expect(copied).toBeVisible();
  await clock.advance(1600);
  await expect(sheet.getByRole("button", { name: "Скопировать журнал" })).toBeVisible();
});

test("успешное копирование после отказа убирает подпись про ручное копирование", async ({
  page,
}) => {
  await page.goto("/");
  const { sheet } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  await breakClipboard(page, "refuses");
  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();
  await expect(sheet.getByText(COPY_FAILED_NOTE, { exact: true })).toBeVisible();

  await mendClipboard(page);
  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();

  await expect(sheet.getByRole("button", { name: /^Скопировано · \d+$/ })).toBeVisible();
  await expect(sheet.getByText(COPY_FAILED_NOTE, { exact: true })).toBeHidden();
});

test("запись при открытом журнале видна и тогда, когда читатель чуть не дошёл до конца", async ({
  page,
}) => {
  await page.goto("/");
  await fillJournal(page);
  const { log } = await openJournal(page);
  const warmReturns = log.getByText(journalLine(WARM_RETURN));
  const scroller = log.locator("xpath=ancestor::*[@data-sheet-scroller]");
  const distanceToEnd = () =>
    scroller.evaluate((node) => node.scrollHeight - node.scrollTop - node.clientHeight);
  await warmReturns.last().hover();
  await page.mouse.wheel(0, -10);
  await expect.poll(distanceToEnd).toBeGreaterThan(5);
  const before = await warmReturns.count();

  await returnToApp(page);

  await expect(warmReturns).toHaveCount(before + 1);
  await expect.poll(distanceToEnd).toBeLessThan(1);
});

test("записи идут сплошным моноширинным текстом, длинные строки переносятся с висячим отступом", async ({
  page,
}) => {
  await page.goto("/");
  const { log } = await openJournal(page);

  const record = log.getByText(journalLine(/Запуск: версия /));

  await expect(record).toHaveCSS("padding-left", "16px");
  await expect(record).toHaveCSS("text-indent", "-16px");
  await expect(record).toHaveCSS("font-family", /mono/i);
});

test("«Очистить»: первое нажатие не стирает и просит подтвердить, второе стирает журнал", async ({
  page,
}) => {
  await page.goto("/");
  const { sheet, log } = await openJournal(page);
  const entry = log.getByText(journalLine(/Запуск: версия /));
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();

  await sheet.getByRole("button", { name: "Очистить" }).click();

  await expect(sheet.getByRole("button", { name: "Точно?" })).toBeVisible();
  await expect(entry).toBeVisible();

  await sheet.getByRole("button", { name: "Точно?" }).click();

  await expect(sheet.getByText("Записей пока нет", { exact: true })).toBeVisible();
  await expect(entry).toBeHidden();
  await expect(sheet.getByRole("button", { name: "Очистить" })).toBeDisabled();
  await expect(sheet.getByRole("button", { name: "Скопировать журнал" })).toBeDisabled();
});

test("после «Очистить» на кнопке копирования нет надписи «Скопировано · N»", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const { sheet } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  // Часы стоят: надпись не исчезнет сама за 2,5 с, пока тест ждёт.
  await clock.freeze();
  await sheet.getByRole("button", { name: "Скопировать журнал" }).click();
  await expect(sheet.getByRole("button", { name: /^Скопировано · \d+$/ })).toBeVisible();

  await sheet.getByRole("button", { name: "Очистить" }).click();
  await sheet.getByRole("button", { name: "Точно?" }).click();

  await expect(sheet.getByRole("button", { name: "Скопировать журнал" })).toBeDisabled();
});

test("после «Очистить» новая запись не оставляет на кнопке «Точно?»: следующее нажатие снова только просит подтвердить", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const { sheet, log } = await openJournal(page);
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  // Часы стоят: таймер первого нажатия не успеет сам вернуть надпись.
  await clock.freeze();
  await sheet.getByRole("button", { name: "Очистить" }).click();
  await sheet.getByRole("button", { name: "Точно?" }).click();
  await expect(sheet.getByText("Записей пока нет", { exact: true })).toBeVisible();

  await returnToApp(page);

  await expect(log.getByText(journalLine(WARM_RETURN))).toBeVisible();
  await expect(sheet.getByRole("button", { name: "Очистить" })).toBeEnabled();
  await sheet.getByRole("button", { name: "Очистить" }).click();
  await expect(sheet.getByRole("button", { name: "Точно?" })).toBeVisible();
  await expect(log.getByText(journalLine(WARM_RETURN))).toBeVisible();
});

test("«Очистить» без второго нажатия через 3,5 с возвращает надпись, и следующее нажатие снова только просит подтвердить", async ({
  page,
  clock,
}) => {
  await page.goto("/");
  const { sheet, log } = await openJournal(page);
  const entry = log.getByText(journalLine(/Запуск: версия /));
  await expect(sheet.getByText(journalLine(/persist\(\)/))).toBeVisible();
  await clock.freeze();

  await sheet.getByRole("button", { name: "Очистить" }).click();
  await clock.advance(3400);
  await expect(sheet.getByRole("button", { name: "Точно?" })).toBeVisible();
  await clock.advance(200);

  await expect(sheet.getByRole("button", { name: "Очистить" })).toBeVisible();
  await sheet.getByRole("button", { name: "Очистить" }).click();
  await expect(sheet.getByRole("button", { name: "Точно?" })).toBeVisible();
  await expect(entry).toBeVisible();
});

test("свайп вниз у верха журнала закрывает шторку целиком", async ({ page }) => {
  await page.goto("/");
  await fillJournal(page);
  const { sheet, log } = await openJournal(page);
  const header = log.getByText(/^Журнал приложения, версия/);
  await log.getByText(journalLine(WARM_RETURN)).last().hover();
  await page.mouse.wheel(0, -100_000);
  await expect(header).toBeInViewport();

  await swipeDown(page, header, 450);

  await expect(sheet).toBeHidden();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("свайп вниз в середине прокрутки журнала шторку не закрывает", async ({ page }) => {
  await page.goto("/");
  await fillJournal(page);
  const { sheet, log } = await openJournal(page);
  const lastLine = log.getByText(journalLine(WARM_RETURN)).last();
  await expect(lastLine).toBeInViewport();

  await swipeDown(page, lastLine, 300);

  await expect(sheet).toBeVisible();
  await expect(log.getByText(/^Журнал приложения, версия/)).not.toBeInViewport();
});

test("после возврата к профилю и повторного входа журнал снова открыт у конца", async ({
  page,
}) => {
  await page.goto("/");
  await fillJournal(page);
  const { sheet, log } = await openJournal(page);
  await sheet.getByRole("button", { name: "Профиль" }).click();

  await page
    .getByRole("dialog", { name: "Профиль" })
    .getByRole("button", { name: "Журнал приложения" })
    .click();

  await expect(log.getByText(journalLine(WARM_RETURN)).last()).toBeInViewport();
});
