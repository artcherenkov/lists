// Проверка собранного релиза в браузере: оба приложения ставят service worker и открываются без сети.
// Сеть выключает вызывающий – остановкой сервера: Playwright в WebKit не умеет «нет сети» вместе с service worker.
// Использование: node scripts/release-check.mjs <адрес> <chromium|webkit> <профиль> <online|offline|back>
//   online  – ставит worker, пишет запись и 10 строк PowerSync;
//   offline – (сервера нет) открывает оба приложения, смотрит записи, пишет ещё запись;
//   back    – (сервер вернулся) смотрит, что очередь ушла.
import { chromium, webkit } from "@playwright/test";

const [base, engineName, profile, phase] = process.argv.slice(2);
const key = process.env.LAB_KEY ?? "k123";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? ` – ${detail}` : ""}`);
};
const ctx = await { chromium, webkit }[engineName].launchPersistentContext(profile);
const text = (page, selector) => page.textContent(selector);
const ready = (page) =>
  page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 60_000 });

if (phase === "online") {
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(`${base}/`);
  await page.evaluate((k) => localStorage.setItem("lab-key", k), key);
  await page.reload();
  await ready(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // страница первого открытия worker не управляется
  await ready(page);
  check(
    "макет: страница управляется service worker",
    await page.evaluate(() => !!navigator.serviceWorker.controller),
  );
  await page.click("#add");
  await page.waitForFunction(
    () => /в очереди 0/.test(document.getElementById("status").textContent),
    null,
    { timeout: 30_000 },
  );
  check(
    "макет: запись ушла на сервер",
    /на сервере/.test(await text(page, "#list li small")),
    await text(page, "#sync"),
  );
  console.log("     ", await text(page, "#build"));
  check(
    "макет: worker со scope /",
    (await page.evaluate(async () => (await navigator.serviceWorker.ready).scope)) === `${base}/`,
  );

  const ps = await ctx.newPage();
  ps.on("pageerror", (e) => console.log("ps pageerror", e.message));
  await ps.goto(`${base}/ps/`);
  await ready(ps);
  check(
    "PowerSync: SQLite открылась",
    !(await ps.evaluate(() => window.__error)),
    await ps.evaluate(() => window.__error ?? ""),
  );
  check(
    "PowerSync: worker со scope /ps/",
    (await ps.evaluate(async () => (await navigator.serviceWorker.ready).scope)) === `${base}/ps/`,
  );
  await ps.reload(); // тоже первое открытие worker
  await ready(ps);
  await ps.click("#add10");
  // По #check, а не по числу строк: OPFS Playwright в WebKit общий у профилей, строки прошлых прогонов остаются.
  await ps.waitForFunction(() =>
    /кнопкой 10, найдено в базе 10/.test(document.getElementById("check").textContent),
  );
  check("PowerSync: 10 строк записаны", true, await text(ps, "#check"));
} else if (phase === "offline") {
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await ready(page);
  check("макет без сети: открылся", (await page.title()) === "Макет Dexie");
  check(
    "макет без сети: запись на месте",
    (await page.locator("#list li").count()) >= 1,
    await text(page, "#status"),
  );
  await page.click("#add");
  await page.waitForFunction(() =>
    /в очереди 1/.test(document.getElementById("status").textContent),
  );
  check("макет без сети: новая запись в очереди", true, await text(page, "#status"));
  const ps = await ctx.newPage();
  await ps.goto(`${base}/ps/`);
  await ready(ps);
  check(
    "PowerSync без сети: открылся своей страницей",
    (await ps.title()) === "Макет PowerSync" && !(await ps.evaluate(() => window.__error)),
  );
  const psCheck = await text(ps, "#check");
  check(
    "PowerSync без сети: строки на месте",
    /кнопкой 10, найдено в базе 10$/.test(psCheck),
    psCheck,
  );
  await page.waitForTimeout(1500);
  console.log("     ", await text(page, "#sync"));
} else if (phase === "back") {
  const page = await ctx.newPage();
  await page.goto(`${base}/`);
  await ready(page);
  await page.waitForFunction(
    () => /в очереди 0/.test(document.getElementById("status").textContent),
    null,
    { timeout: 30_000 },
  );
  check("макет: очередь ушла в сети", true, await text(page, "#status"));
} else throw new Error("фаза: online | offline | back");

await ctx.close();
console.log(results.every(Boolean) ? "ВСЁ ВЕРНО" : "ЕСТЬ ОШИБКИ");
process.exit(results.every(Boolean) ? 0 : 1);
