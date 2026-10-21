import { expect, test, waitForServiceWorker } from "../../fixtures/index.ts";

test.use({ serviceWorkers: "allow" });

test("под service worker запросы /api/ доходят до сервера, а не до index.html", async ({
  page,
}) => {
  await page.goto("/");
  await waitForServiceWorker(page);
  // Первую страницу worker не берёт под управление: с перезагрузки её запросы идут через него.
  await page.reload();
  expect(await page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  const fetched = await page.evaluate(async () => (await fetch("/api/health")).text());
  expect(fetched).toBe('{"ok":true}');

  const opened = await page.goto("/api/health");
  expect(await opened?.text()).toBe('{"ok":true}');
});
