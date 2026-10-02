import type { Locator, Page } from "@playwright/test";

// Номер – «дата коммита · 7 знаков хеша», у сборки с незакоммиченными правками дальше пометка.
// Регулярка проверяет формат, а не конкретный коммит: тест ловит номер неверного формата –
// заглушку или пустую строку. Сборку без git и без APP_VERSION останавливает сама сборка.
export const VERSION_FORMAT = /^\d{4}-\d{2}-\d{2} · [0-9a-f]{7}( · .+)?$/;

/** Нажимает значок «Профиль» и отдаёт шторку и строку с номером версии в ней. */
export async function openProfile(page: Page): Promise<{ sheet: Locator; version: Locator }> {
  await page.getByRole("button", { name: "Профиль" }).click();
  const sheet = page.getByRole("dialog", { name: "Профиль" });
  return { sheet, version: sheet.getByRole("definition") };
}
