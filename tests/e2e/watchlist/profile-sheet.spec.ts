import { expect, openProfile, swipeDown, test, VERSION_FORMAT } from "../../fixtures/index.ts";

test("значок «Профиль» открывает шторку с номером версии, свайп вниз её закрывает", async ({
  page,
}) => {
  await page.goto("/");
  const { sheet, version } = await openProfile(page);

  await test.step("шторка показывает номер версии сборки", async () => {
    await expect(sheet).toBeVisible();
    await expect(version).toHaveText(VERSION_FORMAT);
  });

  await test.step("свайп вниз закрывает шторку", async () => {
    await swipeDown(page, sheet.getByText("Версия", { exact: true }), 450);

    await expect(sheet).toBeHidden();
  });
});
