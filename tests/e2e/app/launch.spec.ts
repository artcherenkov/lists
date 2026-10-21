import { expect, test } from "../../fixtures/index.ts";

// Чужих запросов здесь не проверяем явно: их проваливает автоматический кирпичик ownAddressesOnly.
test("собранное приложение открывается вошедшим и показывает список «Вотчлист»", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeVisible();
  // Заголовок «Вотчлист» есть и у экрана входа, значок «Профиль» – только у списка.
  await expect(page.getByRole("button", { name: "Профиль" })).toBeVisible();
});
