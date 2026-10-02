import type { Locator } from "@playwright/test";

import { expect, test } from "../../fixtures/index.ts";

// Яркость фона 0..255 – по пикселю, который рисует браузер. Так проверяется то, что видит
// человек, а не класс на <html> и не значение токена. Пока стили не загрузились, фон прозрачный:
// это NaN, и ожидание продолжается, а не принимает чёрное за тёмную тему.
async function backgroundBrightness(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = getComputedStyle(element).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    if (pixel[3] !== 255) return Number.NaN;
    return (pixel[0]! + pixel[1]! + pixel[2]!) / 3;
  });
}

const DARK_MAX = 50;
const LIGHT_MIN = 200;

test("открытое приложение перекрашивается вслед за сменой системной темы", async ({ page }) => {
  const background = page.locator("body");
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeVisible();
  await expect.poll(() => backgroundBrightness(background)).toBeGreaterThan(LIGHT_MIN);

  await test.step("система стала тёмной", async () => {
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(() => backgroundBrightness(background)).toBeLessThan(DARK_MAX);
  });

  await test.step("система снова светлая", async () => {
    await page.emulateMedia({ colorScheme: "light" });
    await expect.poll(() => backgroundBrightness(background)).toBeGreaterThan(LIGHT_MIN);
  });
});

test("в тёмной системной теме страница тёмная до загрузки скрипта приложения", async ({ page }) => {
  // Задержка сети – условие проверки: скрипты приложения не приходят, пока тест не отпустит.
  let releaseScripts!: () => void;
  const scriptsReleased = new Promise<void>((resolve) => (releaseScripts = resolve));
  await page.route("**/*.js", async (route) => {
    await scriptsReleased;
    await route.continue();
  });
  await page.emulateMedia({ colorScheme: "dark" });

  await page.goto("/", { waitUntil: "commit" });
  await expect(page.locator("body")).toBeAttached();
  await expect.poll(() => backgroundBrightness(page.locator("body"))).toBeLessThan(DARK_MAX);
  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeHidden();

  releaseScripts();
  await expect(page.getByRole("heading", { level: 1, name: "Вотчлист" })).toBeVisible();
  await expect.poll(() => backgroundBrightness(page.locator("body"))).toBeLessThan(DARK_MAX);
});
