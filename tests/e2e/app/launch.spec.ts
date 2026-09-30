import { expect, test } from "../../fixtures/index.ts";

// Чужих запросов здесь не проверяем явно: их проваливает автоматический кирпичик ownAddressesOnly.
test("собранное приложение открывается и показывает заголовок «Вотчлист»", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeVisible();
});
