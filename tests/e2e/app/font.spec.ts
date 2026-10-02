import { expect, test } from "../../fixtures/index.ts";

// Пакет шрифта отдаёт CSS семи наборов символов, и после смены пресета shadcn он может вернуться:
// service worker скачал бы лишние 150 КБ. Нужны только латиница и кириллица, и обе
// загружаются, когда на странице есть такие буквы.
test("шрифт Inter подключён только для латиницы и кириллицы, и оба набора загружаются", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeVisible();

  const faceStatuses = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((face) => face.family.includes("Inter Variable"))
      .map((face) => face.status);
  });

  expect(faceStatuses).toEqual(["loaded", "loaded"]);
});
