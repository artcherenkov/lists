import type { Locator, Page } from "@playwright/test";

import { openProfile } from "./profile.ts";

/**
 * Профиль → строка «Журнал приложения»: журнал открывается в той же шторке. Отдаёт шторку,
 * контейнер с записями и номер версии, который профиль показывал до перехода.
 */
export async function openJournal(
  page: Page,
): Promise<{ sheet: Locator; log: Locator; appVersion: string }> {
  const { sheet: profile, version } = await openProfile(page);
  const appVersion = await version.innerText();
  await profile.getByRole("button", { name: "Журнал приложения" }).click();
  const sheet = page.getByRole("dialog", { name: "Журнал приложения" });
  return { sheet, log: sheet.getByTestId("journal-log"), appVersion };
}
