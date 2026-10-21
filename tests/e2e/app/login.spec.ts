import type { Page } from "@playwright/test";

import {
  BOT_USERNAME,
  codeFromBot,
  expect,
  journalLine,
  messageFromBot,
  openJournal,
  openProfile,
  test,
  waitForServiceWorker,
} from "../../fixtures/index.ts";

// Здесь вход – предмет теста: тест начинает без входа и входит сам, через экран.
test.use({ signedIn: false });

const codeField = (page: Page) => page.getByLabel("Код из Telegram", { exact: true });
const botLink = (page: Page) => page.getByRole("link", { name: "Открыть бота в Telegram" });
// Значок «Профиль» есть только у списка: по нему видно, что человек вошёл.
const profileButton = (page: Page) => page.getByRole("button", { name: "Профиль" });

test("без входа виден только экран входа, ссылка ведёт к боту и сразу присылает код", async ({
  page,
}) => {
  await page.goto("/");

  await expect(botLink(page)).toHaveAttribute("href", `https://t.me/${BOT_USERNAME}?start=login`);
  await expect(page.getByText(`@${BOT_USERNAME}`)).toBeVisible();
  await expect(codeField(page)).toBeVisible();
  await expect(profileButton(page)).toHaveCount(0);
});

test("код из бота впускает, вход переживает перезапуск, журнал пишет вход без имени", async ({
  page,
  server,
  telegramUser,
}) => {
  await page.goto("/");

  await test.step("сообщение бота, вставленное в поле целиком, сразу впускает", async () => {
    const { message } = await messageFromBot(server.api, telegramUser);
    await codeField(page).fill(message);

    await expect(profileButton(page)).toBeVisible();
  });

  await test.step("после перезапуска – снова список, а в профиле имя из Telegram", async () => {
    await page.reload();
    const { sheet } = await openProfile(page);

    await expect(sheet.getByText("Анна", { exact: true })).toBeVisible();
  });

  await test.step("журнал пишет вход без имени", async () => {
    await page.reload();
    const { sheet, log } = await openJournal(page);

    await expect(sheet.getByText(journalLine("Вход кодом из Telegram"))).toBeVisible();
    await expect(log).not.toContainText("Анна");
  });
});

test("неверный код – объяснение на экране, новый код, вставленный в поле с ним, впускает", async ({
  page,
  server,
  telegramUser,
}) => {
  await page.goto("/");
  const code = await codeFromBot(server.api, telegramUser);

  await codeField(page).fill("00000000");
  await expect(page.getByRole("alert")).toHaveText(
    "Код неверный или устарел. Проверьте цифры или получите новый код у бота.",
  );

  await codeField(page).press("End");
  await page.keyboard.insertText(code);
  await expect(profileButton(page)).toBeVisible();
});

test("выход в профиле возвращает экран входа, и перезапуск его не отменяет", async ({
  page,
  server,
  telegramUser,
}) => {
  await page.goto("/");
  await codeField(page).fill(await codeFromBot(server.api, telegramUser));
  const { sheet } = await openProfile(page);

  await sheet.getByRole("button", { name: "Выйти" }).click();
  await expect(botLink(page)).toBeVisible();

  await page.reload();
  await expect(botLink(page)).toBeVisible();
  await expect(profileButton(page)).toHaveCount(0);
});

test("сервер не помнит вход устройства – экран входа", async ({
  page,
  context,
  server,
  telegramUser,
}) => {
  await page.goto("/");
  await codeField(page).fill(await codeFromBot(server.api, telegramUser));
  await expect(profileButton(page)).toBeVisible();

  // Cookie сессии истекла или удалена: запись о входе на устройстве осталась.
  await context.clearCookies();
  await page.reload();

  await expect(botLink(page)).toBeVisible();
  await expect(profileButton(page)).toHaveCount(0);
});

test("вход и выход в одной вкладке видны в другой", async ({
  page,
  context,
  server,
  telegramUser,
}) => {
  await page.goto("/");
  const other = await context.newPage();
  await other.goto("/");
  await expect(botLink(other)).toBeVisible();

  await test.step("вход в первой вкладке открывает список во второй", async () => {
    await codeField(page).fill(await codeFromBot(server.api, telegramUser));
    await expect(profileButton(other)).toBeVisible();
  });

  await test.step("выход в первой вкладке возвращает вторую на экран входа", async () => {
    const { sheet } = await openProfile(page);
    await sheet.getByRole("button", { name: "Выйти" }).click();
    await expect(botLink(other)).toBeVisible();
  });
});

test.describe("без связи", () => {
  test.use({ serviceWorkers: "allow" });

  test("экран входа ждёт сеть: ссылка на бота появляется, когда связь вернулась, и тот же код впускает", async ({
    page,
    context,
    clock,
    server,
    telegramUser,
  }) => {
    await page.goto("/");
    await expect(botLink(page)).toBeVisible();
    await waitForServiceWorker(page);
    await context.setOffline(true);
    await page.reload();

    await expect(
      page.getByText("Нет связи с сервером: ссылка на бота появится, когда связь вернётся.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Открыть бота в Telegram" })).toBeDisabled();

    // Код можно получить у бота и без сети на этом устройстве – например, на телефоне.
    const code = await codeFromBot(server.api, telegramUser);
    await codeField(page).fill(code);
    await expect(page.getByRole("alert")).toHaveText(
      "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.",
    );

    await test.step("связь вернулась: имя бота приходит по событию online", async () => {
      // Часы стоят, поэтому повтор по таймеру не сработает: ссылку может вернуть только событие.
      await clock.freeze();
      await context.setOffline(false);
      await expect(botLink(page)).toBeVisible();
    });

    await test.step("тот же код, вставленный снова, впускает", async () => {
      await codeField(page).fill(`${code.slice(0, 4)} ${code.slice(4)}`);
      await expect(profileButton(page)).toBeVisible();
    });
  });

  test("сессия кончилась, пока не было сети: когда связь вернулась, приложение показывает экран входа", async ({
    page,
    context,
    server,
    telegramUser,
  }) => {
    await page.goto("/");
    await codeField(page).fill(await codeFromBot(server.api, telegramUser));
    await expect(profileButton(page)).toBeVisible();
    await waitForServiceWorker(page);

    await context.setOffline(true);
    await context.clearCookies();
    // Сверка при запуске не дошла до сервера: экран входа может вернуть только сверка по `online`.
    const startCheckFailed = page.waitForEvent("requestfailed", (request) =>
      request.url().endsWith("/api/auth/get-session"),
    );
    await page.reload();
    await startCheckFailed;
    await expect(profileButton(page)).toBeVisible();

    await context.setOffline(false);
    await expect(botLink(page)).toBeVisible();
  });
});
