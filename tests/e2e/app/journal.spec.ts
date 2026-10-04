import {
  closeWithoutEvents,
  escapeRegExp,
  expect,
  journalLine,
  moveToBackground,
  newVersionButton,
  openFirstBuildUnderWorker,
  openJournal,
  openProfile,
  prepareHiddenLaunch,
  prepareSilentClose,
  returnToApp,
  showApp,
  TIME_FORMAT,
  testWithOwnServer as test,
  waitForServiceWorker,
} from "../../fixtures/index.ts";

// Версию второй сборки задаёт скрипт build:next в apps/watchlist/package.json.
const NEXT_VERSION = "2000-01-01 · 2222222";

test.describe("запуск и возвраты", () => {
  test("запуск во вкладке записан: номер версии, первый запуск, persist() не вызывается", async ({
    page,
  }) => {
    await page.goto("/");

    const { sheet, appVersion } = await openJournal(page);

    await expect(
      sheet.getByText(
        journalLine(
          new RegExp(
            `Запуск: версия ${escapeRegExp(appVersion)}, timeOrigin .+, навигация navigate, видимость visible, с экрана «Домой»: нет$`,
          ),
        ),
      ),
    ).toBeVisible();
    await expect(
      sheet.getByText(journalLine("Первый запуск: прежнего состояния нет")),
    ).toBeVisible();
    await expect(
      sheet.getByText(
        journalLine(
          /persist\(\) не вызван: приложение открыто во вкладке, а не с экрана «Домой»; persisted\(\) = (да|нет)$/,
        ),
      ),
    ).toBeVisible();
  });

  test("с экрана «Домой» запуск записан как домашний и persist() вызван", async ({
    page,
    context,
  }) => {
    // Подменяется платформа: так Safari сообщает, что приложение открыто с экрана «Домой».
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    });
    await page.goto("/");

    const { sheet } = await openJournal(page);

    await expect(
      sheet.getByText(journalLine(/Запуск: версия .+, с экрана «Домой»: да$/)),
    ).toBeVisible();
    await expect(
      sheet.getByText(
        journalLine(
          /persisted\(\) до: (да|нет); persist\(\) ответил: (да|нет); persisted\(\) после: (да|нет)$/,
        ),
      ),
    ).toBeVisible();
  });

  test("возврат в приложение записан тёплым возвратом", async ({ page }) => {
    await page.goto("/");

    await returnToApp(page);

    const { sheet } = await openJournal(page);
    await expect(sheet.getByText(journalLine("visibilitychange: страница скрыта"))).toBeVisible();
    await expect(
      sheet.getByText(
        journalLine("visibilitychange: страница снова видна, тёплый возврат, в фоне 0 с"),
      ),
    ).toBeVisible();
  });

  test("приложение выгружено из фона: следующий запуск холодный, а выгруженное без ухода в фон запуск называет по последней записи", async ({
    page,
    context,
  }) => {
    await prepareSilentClose(context);
    await page.goto("/");
    await moveToBackground(page);
    await closeWithoutEvents(page);

    const cold = await context.newPage();
    await cold.goto("/");
    const { log: coldLog } = await openJournal(cold);
    await expect(
      coldLog.getByText(
        journalLine(
          new RegExp(`Холодный запуск: прежняя страница ушла в фон ${TIME_FORMAT}, прошло \\d+ с$`),
        ),
      ),
    ).toBeVisible();
    await closeWithoutEvents(cold);

    const afterSilentPage = await context.newPage();
    await afterSilentPage.goto("/");
    const { log } = await openJournal(afterSilentPage);
    await expect(
      log.getByText(
        journalLine(
          new RegExp(
            `Запуск без записанного ухода в фон: прежняя страница ухода не записала, её последняя запись ${TIME_FORMAT}, прошло \\d+ с$`,
          ),
        ),
      ),
    ).toBeVisible();
    await expect(log.getByText(journalLine(/Холодный запуск: /))).toHaveCount(1);
  });

  test("после перезагрузки страницы прежние записи на месте и есть запись запуска после перезагрузки", async ({
    page,
  }) => {
    await page.goto("/");

    await page.reload();

    const { sheet } = await openJournal(page);
    await test.step("прежние записи на месте", async () => {
      await expect(
        sheet.getByText(journalLine("Первый запуск: прежнего состояния нет")),
      ).toBeVisible();
    });
    await test.step("новый запуск назван запуском после перезагрузки", async () => {
      await expect(
        sheet.getByText(
          journalLine(
            /Запуск: версия .+, timeOrigin .+, навигация reload, видимость visible, с экрана «Домой»: нет$/,
          ),
        ),
      ).toBeVisible();
      await expect(
        sheet.getByText(
          journalLine(
            new RegExp(
              `Запуск после закрытия или перезагрузки страницы \\(pagehide\\): прежняя страница ушла из виду ${TIME_FORMAT}, прошло \\d+ с$`,
            ),
          ),
        ),
      ).toBeVisible();
    });
  });

  test("страница, загруженная в фоне, при первом показе названа впервые видной, а не тёплым возвратом", async ({
    page,
    context,
  }) => {
    await prepareHiddenLaunch(context);
    await page.goto("/");

    await showApp(page);

    const { sheet } = await openJournal(page);
    await expect(
      sheet.getByText(journalLine(/Запуск: версия .+, видимость hidden, с экрана «Домой»: нет$/)),
    ).toBeVisible();
    await expect(
      sheet.getByText(
        journalLine(/visibilitychange: страница впервые видна, загружена в фоне \d+ с назад$/),
      ),
    ).toBeVisible();
    await expect(sheet.getByText(journalLine(/тёплый возврат/))).toHaveCount(0);
  });

  test("платформа без service worker, как небезопасный контекст: об этом запись в журнале, приложение открывается", async ({
    page,
    context,
  }) => {
    // Подменяется платформа: свойства `navigator.serviceWorker` нет вовсе, как по http.
    await context.addInitScript(() => {
      Reflect.deleteProperty(Navigator.prototype, "serviceWorker");
    });
    await page.goto("/");
    expect(await page.evaluate(() => "serviceWorker" in navigator)).toBe(false);

    const { sheet } = await openJournal(page);

    await expect(sheet.getByText(journalLine("serviceWorker недоступен"))).toBeVisible();
  });
});

test.describe("сбой журнала", () => {
  test("сбой шага запуска записан в журнал, остальные шаги выполнены, приложение открывается", async ({
    page,
    context,
  }) => {
    // Подменяется платформа: окружение без Navigation Timing, как старый встроенный браузер.
    await context.addInitScript(() => {
      performance.getEntriesByType = () => {
        throw new Error("Navigation Timing недоступен");
      };
    });
    await page.goto("/");

    const { sheet } = await openJournal(page);

    await expect(
      sheet.getByText(
        journalLine("Сбой журнала на шаге «запуск»: Error: Navigation Timing недоступен"),
      ),
    ).toBeVisible();
    await expect(sheet.getByText(journalLine(/controller при запуске: /))).toBeVisible();
  });
});

test.describe("записи пробы", () => {
  test("записи пробы, лежавшие на устройстве, видны в начале журнала, а ключей пробы больше нет", async ({
    page,
    context,
  }) => {
    // Исходное состояние телефона автора: пробная сборка уже копила журнал в localStorage.
    await context.addInitScript(() => {
      localStorage.setItem(
        "probe-log",
        JSON.stringify([
          { t: Date.parse("2026-10-03T21:14:02"), e: "visibilitychange", d: "hidden" },
          { t: Date.parse("2026-10-03T21:14:09"), e: "pagehide", d: "persisted=false" },
        ]),
      );
      localStorage.setItem("probe-state", JSON.stringify({ hiddenAt: 1 }));
      localStorage.setItem("probe-marker-seen", "1");
    });
    await page.goto("/");

    const { log } = await openJournal(page);

    await test.step("записи пробы – сразу после первой строки, затем запуск", async () => {
      await expect(log.getByText(journalLine("проба: visibilitychange hidden"))).toBeVisible();
      await expect(log.getByText(journalLine("проба: pagehide persisted=false"))).toBeVisible();
      await expect(
        log.getByText(journalLine(/Запуск: версия .+, навигация navigate/)),
      ).toBeVisible();
      const lines = (await log.innerText()).split("\n");
      expect(lines.slice(1, 4).map((line) => line.slice("2026-10-03 21:14:02 ".length))).toEqual([
        "проба: visibilitychange hidden",
        "проба: pagehide persisted=false",
        expect.stringMatching(/^Запуск: версия /),
      ]);
    });
    await test.step("запуск называет время последней записи пробы и число перенесённых записей", async () => {
      await expect(
        log.getByText(
          journalLine(
            /Запуск без записанного ухода в фон: прежняя страница ухода не записала, её последняя запись 2026-10-03 21:14:09, прошло .+$/,
          ),
        ),
      ).toBeVisible();
      await expect(log.getByText(journalLine("Перенесены записи пробы: 2"))).toBeVisible();
    });
    await test.step("ключей пробы больше нет", async () => {
      const keys = await page.evaluate(() =>
        ["probe-log", "probe-state", "probe-marker-seen"].map((key) => localStorage.getItem(key)),
      );
      expect(keys).toEqual([null, null, null]);
    });
  });
});

test.describe("обновление версии", () => {
  test.use({ serviceWorkers: "allow" });

  test("журнал фиксирует проверку при возврате, найденную, установленную и ждущую версию, «Обновить», смену controller и переживает обновление", async ({
    page,
    ownServer,
  }) => {
    await openFirstBuildUnderWorker(page, ownServer);
    const { version } = await openProfile(page);
    const firstVersion = await version.innerText();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await ownServer.switchToNextBuild();
    await returnToApp(page);
    await expect(newVersionButton(page)).toBeVisible();

    const { sheet: beforeUpdate } = await openJournal(page);
    await test.step("проверка при возврате, найденная, установленная и ждущая версия", async () => {
      await expect(
        beforeUpdate.getByText(journalLine("Проверка обновления начата (возврат на экран)")),
      ).toBeVisible();
      await expect(
        beforeUpdate.getByText(journalLine("Найдена новая версия (updatefound)")),
      ).toBeVisible();
      await expect(
        beforeUpdate.getByText(journalLine("Новая версия установлена и ждёт включения")),
      ).toBeVisible();
      await expect(
        beforeUpdate.getByText(
          journalLine(
            /Проверка обновления завершена за \d+ с; active=activated, waiting=\S+, installing=\S+$/,
          ),
        ),
      ).toBeVisible();
    });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await newVersionButton(page).click();
    await expect(newVersionButton(page)).toBeHidden();

    const { sheet, appVersion } = await openJournal(page);
    await test.step("запуск новой версии записан с её номером", async () => {
      expect(appVersion).toBe(NEXT_VERSION);
      await expect(
        sheet.getByText(
          journalLine(
            new RegExp(
              `Запуск: версия ${escapeRegExp(NEXT_VERSION)}, timeOrigin .+, навигация reload, видимость visible`,
            ),
          ),
        ),
      ).toBeVisible();
    });
    await test.step("журнал пережил обновление: записи прежней версии и «Обновить» на месте", async () => {
      await expect(
        sheet
          .getByText(
            journalLine(
              new RegExp(`Запуск: версия ${escapeRegExp(firstVersion)}, timeOrigin .+, навигация`),
            ),
          )
          .first(),
      ).toBeVisible();
      await expect(
        sheet.getByText(journalLine("Нажато «Обновить»: ждущая версия есть")),
      ).toBeVisible();
      await expect(
        sheet.getByText(journalLine("Сменился controller: страница перезагружается")),
      ).toBeVisible();
      await expect(sheet.getByText(journalLine(/Сменился controller: \S+$/))).toBeVisible();
    });
  });

  test("первая установка worker не названа новой версией, которая ждёт включения", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForServiceWorker(page);

    const { sheet } = await openJournal(page);

    await expect(
      sheet.getByText(journalLine("Найден первый worker (updatefound, прежнего нет)")),
    ).toBeVisible();
    await expect(
      sheet.getByText(journalLine("Новая версия установлена и ждёт включения")),
    ).toHaveCount(0);
  });

  test("«Обновить» в сеансе первого открытия записано как нажатие без ждущей версии", async ({
    page,
    ownServer,
  }) => {
    await page.goto("/");
    await waitForServiceWorker(page);
    await ownServer.switchToNextBuild();
    await returnToApp(page);
    await newVersionButton(page).click();
    await expect(newVersionButton(page)).toBeHidden({ timeout: 2500 });

    const { sheet } = await openJournal(page);

    await expect(
      sheet.getByText(
        journalLine("Нажато «Обновить»: ждущей версии нет, страница перезагружается сразу"),
      ),
    ).toBeVisible();
  });

  test("«Обновить», когда новая версия не включилась, записано перезагрузкой по таймауту через 3 с", async ({
    page,
    ownServer,
  }) => {
    await openFirstBuildUnderWorker(page, ownServer);
    await ownServer.switchToNextBuild();
    await returnToApp(page);
    await expect(newVersionButton(page)).toBeVisible();
    // Подменяется платформа: настоящий worker включается по сообщению SKIP_WAITING, и другим
    // способом условие «новая версия не включилась» не создать. Метка пропадёт вместе со страницей.
    await page.evaluate(() => {
      ServiceWorker.prototype.postMessage = () => {};
      Object.assign(window, { isOldPage: true });
    });
    await newVersionButton(page).click();
    await page.waitForFunction(() => !("isOldPage" in window), undefined, { timeout: 10_000 });

    const { sheet } = await openJournal(page);

    await expect(
      sheet.getByText(
        journalLine("Прошло 3 с после «Обновить»: страница перезагружается по таймауту"),
      ),
    ).toBeVisible();
    await expect(
      sheet.getByText(journalLine("Нажато «Обновить»: ждущая версия есть")),
    ).toBeVisible();
  });

  test("раз в час журнал пишет проверку обновления", async ({ page, clock, ownServer }) => {
    await openFirstBuildUnderWorker(page, ownServer);

    await clock.advance(60 * 60 * 1000);

    const { sheet } = await openJournal(page);
    await expect(
      sheet.getByText(journalLine("Проверка обновления начата (раз в час)")),
    ).toBeVisible();
  });

  test("недоступный сервер: отказ проверки обновления записан в журнал", async ({
    page,
    ownServer,
  }) => {
    await openFirstBuildUnderWorker(page, ownServer);
    const { sheet } = await openJournal(page);
    await ownServer.stop();

    await returnToApp(page);

    await expect(
      sheet.getByText(journalLine("Проверка обновления начата (возврат на экран)")),
    ).toBeVisible();
    await expect(
      sheet.getByText(journalLine(/Проверка обновления закончилась ошибкой: TypeError: .+$/)),
    ).toBeVisible();
  });
});
