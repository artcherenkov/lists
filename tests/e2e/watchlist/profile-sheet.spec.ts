import { expect, swipeDown, test } from "../../fixtures/index.ts";

// Номер – «дата коммита · 7 знаков хеша», у сборки с незакоммиченными правками дальше пометка.
// Регулярка проверяет формат, а не конкретный коммит: тест ловит номер неверного формата –
// заглушку или пустую строку. Сборку без git и без APP_VERSION останавливает сама сборка.
const VERSION_FORMAT = /^\d{4}-\d{2}-\d{2} · [0-9a-f]{7}( · .+)?$/;

test("значок «Профиль» открывает шторку с номером версии, свайп вниз её закрывает", async ({
  page,
}) => {
  await page.goto("/");
  const sheet = page.getByRole("dialog", { name: "Профиль" });

  await test.step("шторка показывает номер версии сборки", async () => {
    await page.getByRole("button", { name: "Профиль" }).click();

    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("definition")).toHaveText(VERSION_FORMAT);
  });

  await test.step("свайп вниз закрывает шторку", async () => {
    await swipeDown(page, sheet.getByText("Версия", { exact: true }), 450);

    await expect(sheet).toBeHidden();
  });
});
