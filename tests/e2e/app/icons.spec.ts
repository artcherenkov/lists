import type { Page } from "@playwright/test";

import { expect, test } from "../../fixtures/index.ts";

type LoadedIcon = {
  status: number;
  contentType: string | null;
  width: number;
  height: number;
  cornerAlphas: number[];
};

// Иконку берём по ссылке из страницы и раскодируем так, как её раскодирует браузер: битая ссылка
// или пропавший файл, вместо которого страница отдаёт index.html, видны здесь, а не после
// установки на телефон.
async function loadIconLinkedFromPage(page: Page, rel: string): Promise<LoadedIcon> {
  return page.evaluate(async (linkRel) => {
    const link = document.querySelector<HTMLLinkElement>(`link[rel="${linkRel}"]`);
    if (!link) throw new Error(`На странице нет <link rel="${linkRel}">`);
    const response = await fetch(link.href);
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
  }, rel);
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
