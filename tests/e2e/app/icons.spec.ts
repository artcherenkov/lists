import type { Page } from "@playwright/test";

import { expect, test } from "../../fixtures/index.ts";

type LoadedIcon = {
  status: number;
  contentType: string | null;
  width: number;
  height: number;
  cornerAlphas: number[];
};

// Иконку берём по ссылке и раскодируем так, как её раскодирует браузер: битая ссылка или пропавший
// файл, вместо которого страница отдаёт index.html, видны здесь, а не после установки на телефон.
async function loadIcon(page: Page, url: string): Promise<LoadedIcon> {
  return page.evaluate(async (iconUrl) => {
    const response = await fetch(iconUrl);
    const bitmap = await createImageBitmap(await response.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    return {
      status: response.status,
      contentType: response.headers.get("content-type"),
      width: bitmap.width,
      height: bitmap.height,
      cornerAlphas: [
        [0, 0],
        [bitmap.width - 1, 0],
        [0, bitmap.height - 1],
        [bitmap.width - 1, bitmap.height - 1],
      ].map(([x, y]) => context.getImageData(x!, y!, 1, 1).data[3]!),
    };
  }, url);
}

async function hrefOfLinkOnPage(page: Page, rel: string): Promise<string> {
  return page.evaluate((linkRel) => {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="${linkRel}"]`);
    if (!link) throw new Error(`На странице нет <link rel="${linkRel}">`);
    return link.href;
  }, rel);
}

async function loadIconLinkedFromPage(page: Page, rel: string): Promise<LoadedIcon> {
  return loadIcon(page, await hrefOfLinkOnPage(page, rel));
}

test("иконка вкладки отдаётся приложением как PNG 64×64", async ({ page }) => {
  await page.goto("/");

  const icon = await loadIconLinkedFromPage(page, "icon");

  expect(icon).toMatchObject({ status: 200, contentType: "image/png", width: 64, height: 64 });
});

// iOS заливает прозрачные места иконки чёрным, поэтому углы apple-touch-icon должны быть закрашены.
test("apple-touch-icon отдаётся приложением как непрозрачный PNG 180×180", async ({ page }) => {
  await page.goto("/");

  const icon = await loadIconLinkedFromPage(page, "apple-touch-icon");

  expect(icon).toMatchObject({ status: 200, contentType: "image/png", width: 180, height: 180 });
  expect(icon.cornerAlphas).toEqual([255, 255, 255, 255]);
});

// Тест падает, если страница не ссылается на манифест, путь иконки в нём ведёт мимо файла, файл
// не того размера или манифест заявляет не 192 и 512.
test("иконки манифеста отдаются как PNG заявленных в нём размеров", async ({ page }) => {
  await page.goto("/");

  const manifestUrl = await hrefOfLinkOnPage(page, "manifest");
  const manifest = await page.evaluate(
    async (url) =>
      (await fetch(url)).json() as Promise<{ icons: { src: string; sizes: string }[] }>,
    manifestUrl,
  );
  const icons = await Promise.all(
    manifest.icons.map(async ({ src, sizes }) => ({
      declaredSizes: sizes,
      ...(await loadIcon(page, new URL(src, manifestUrl).href)),
    })),
  );

  expect(icons.map((icon) => icon.declaredSizes)).toEqual(["192x192", "512x512"]);
  for (const icon of icons) {
    expect(icon).toMatchObject({
      status: 200,
      contentType: "image/png",
      declaredSizes: `${icon.width}x${icon.height}`,
    });
  }
});

// Chrome не предложит установку без `display` (кроме `browser`), `start_url` и имени (`name` или
// `short_name`). Остальные значения – решение вехи 2: отдельное окно, открытие с главного экрана,
// название на русском; их потеря установку не ломает.
test("манифест задаёт имя, отдельное окно и стартовую страницу установленного приложения", async ({
  page,
}) => {
  await page.goto("/");

  const manifestUrl = await hrefOfLinkOnPage(page, "manifest");
  const manifest = await page.evaluate(
    async (url) => (await fetch(url)).json() as Promise<Record<string, unknown>>,
    manifestUrl,
  );

  expect(manifest).toMatchObject({
    name: "Вотчлист",
    short_name: "Вотчлист",
    lang: "ru",
    display: "standalone",
    start_url: "/",
  });
});
