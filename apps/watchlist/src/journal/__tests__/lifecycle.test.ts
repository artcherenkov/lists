import { describe, expect, it } from "vitest";

import { brokenStorage, memoryStorage } from "../../storage/__tests__/fake-storage.ts";
import {
  describeLaunch,
  describeLaunchKind,
  launchPageState,
  pageHidden,
  pageShown,
  pageUnloaded,
  PAGE_STATE_KEY,
  readPageState,
  VISIBLE_PAGE,
  watchLifecycle,
  writePageState,
  type PageState,
} from "../lifecycle.ts";
import { moscow, useMoscowTime } from "./setup-time.ts";

describe("вид запуска", () => {
  const away = moscow(2026, 10, 4, 12, 0, 0);

  it("первый запуск: прежнего состояния и записей нет", () => {
    expect(describeLaunchKind({ previous: undefined, lastRecordAt: undefined, now: away })).toBe(
      "Первый запуск: прежнего состояния нет",
    );
  });

  it("холодный запуск: прежняя страница ушла в фон, сколько прошло", () => {
    useMoscowTime();
    const now = away + ((3 * 60 + 2) * 60 + 1) * 1000;
    expect(
      describeLaunchKind({
        previous: { hiddenAt: away, unloaded: false },
        lastRecordAt: away + 5000,
        now,
      }),
    ).toBe(
      "Холодный запуск: прежняя страница ушла в фон 2026-10-04 12:00:00, прошло 3 ч 2 мин 1 с",
    );
  });

  it("страница, загруженная в фоне и выгруженная без показа: следующий запуск называет время загрузки как уход в фон", () => {
    useMoscowTime();
    expect(
      describeLaunchKind({
        previous: launchPageState("hidden", away),
        lastRecordAt: away,
        now: away + 4000,
      }),
    ).toBe("Холодный запуск: прежняя страница ушла в фон 2026-10-04 12:00:00, прошло 4 с");
  });

  it("после pagehide (перезагрузка, закрытие) вид называется иначе", () => {
    useMoscowTime();
    expect(
      describeLaunchKind({
        previous: { hiddenAt: away, unloaded: true },
        lastRecordAt: away,
        now: away + 4000,
      }),
    ).toBe(
      "Запуск после закрытия или перезагрузки страницы (pagehide): прежняя страница ушла из виду 2026-10-04 12:00:00, прошло 4 с",
    );
  });

  it("прежняя страница ухода не записала: называется время её последней записи", () => {
    useMoscowTime();
    const text =
      "Запуск без записанного ухода в фон: прежняя страница ухода не записала, её последняя запись 2026-10-04 12:00:00, прошло 5 мин 0 с";
    const now = away + 5 * 60 * 1000;
    expect(describeLaunchKind({ previous: VISIBLE_PAGE, lastRecordAt: away, now })).toBe(text);
    expect(describeLaunchKind({ previous: undefined, lastRecordAt: away, now })).toBe(text);
  });

  it("состояние есть, а записей нет (журнал очищен)", () => {
    expect(describeLaunchKind({ previous: VISIBLE_PAGE, lastRecordAt: undefined, now: away })).toBe(
      "Запуск без записанного ухода в фон: записей прежней страницы нет",
    );
  });

  it("строка запуска перечисляет версию, timeOrigin, навигацию, видимость и экран «Домой»", () => {
    useMoscowTime();
    expect(
      describeLaunch({
        version: "2026-10-04 · abc1234",
        timeOrigin: moscow(2026, 10, 4, 12, 0, 0),
        navigationType: "reload",
        visibility: "visible",
        homeScreen: true,
      }),
    ).toBe(
      "Запуск: версия 2026-10-04 · abc1234, timeOrigin 2026-10-04 12:00:00, навигация reload, видимость visible, с экрана «Домой»: да",
    );
  });
});

describe("состояние страницы", () => {
  it("hidden после pagehide не сбрасывает выгрузку", () => {
    expect(pageHidden(pageUnloaded(VISIBLE_PAGE, 100), 101)).toEqual({
      hiddenAt: 100,
      unloaded: true,
    });
  });

  it("уход в фон запоминает первый момент, pagehide его не сдвигает", () => {
    const hidden = pageHidden(VISIBLE_PAGE, 100);
    expect(pageHidden(hidden, 200)).toEqual({ hiddenAt: 100, unloaded: false });
    expect(pageUnloaded(hidden, 300)).toEqual({ hiddenAt: 100, unloaded: true });
  });

  it("pagehide без предшествующего ухода в фон сам ставит момент ухода", () => {
    expect(pageUnloaded(VISIBLE_PAGE, 300)).toEqual({ hiddenAt: 300, unloaded: true });
  });

  it("возврат сбрасывает состояние и называет время в фоне", () => {
    expect(pageShown({ hiddenAt: 1000, unloaded: false }, 126_000)).toEqual({
      state: VISIBLE_PAGE,
      backgroundMs: 125_000,
    });
    expect(pageShown(VISIBLE_PAGE, 5).backgroundMs).toBeUndefined();
  });

  it("страница, открытая в фоне, считает фон от запуска", () => {
    expect(launchPageState("hidden", 50)).toEqual({ hiddenAt: 50, unloaded: false });
    expect(launchPageState("visible", 50)).toEqual(VISIBLE_PAGE);
  });
});

describe("хранение состояния", () => {
  it("записанное состояние читается обратно", () => {
    const storage = memoryStorage();
    writePageState(storage, { hiddenAt: 5, unloaded: true });
    expect(readPageState(storage)).toEqual({ hiddenAt: 5, unloaded: true });
    writePageState(storage, VISIBLE_PAGE);
    expect(readPageState(storage)).toEqual({ unloaded: false });
  });

  it("битое, неполное и недоступное состояние читается как отсутствующее", () => {
    expect(readPageState(memoryStorage())).toBeUndefined();
    expect(readPageState(memoryStorage({ [PAGE_STATE_KEY]: "{" }))).toBeUndefined();
    expect(readPageState(memoryStorage({ [PAGE_STATE_KEY]: '{"hiddenAt":1}' }))).toBeUndefined();
    expect(
      readPageState(memoryStorage({ [PAGE_STATE_KEY]: '{"hiddenAt":"1","unloaded":false}' })),
    ).toBeUndefined();
    expect(readPageState(brokenStorage)).toBeUndefined();
    expect(() => writePageState(brokenStorage, VISIBLE_PAGE)).not.toThrow();
  });
});

describe("watchLifecycle", () => {
  function setup(initial: PageState = VISIBLE_PAGE, loadedHidden = false) {
    const doc = Object.assign(new EventTarget(), {
      visibilityState: "visible" as DocumentVisibilityState,
    });
    const win = new EventTarget();
    const lines: string[] = [];
    const saved: PageState[] = [];
    let now = 0;
    watchLifecycle({
      doc,
      win,
      now: () => now,
      log: (text) => lines.push(text),
      initial,
      loadedHidden,
      save: (state) => saved.push(state),
    });
    return {
      lines,
      saved,
      at: (ms: number) => void (now = ms),
      visibility(state: DocumentVisibilityState) {
        doc.visibilityState = state;
        doc.dispatchEvent(new Event("visibilitychange"));
      },
      show: (persisted: boolean) =>
        win.dispatchEvent(Object.assign(new Event("pageshow"), { persisted })),
      hide: (persisted: boolean) =>
        win.dispatchEvent(Object.assign(new Event("pagehide"), { persisted })),
    };
  }

  it("тёплый возврат: скрытие, затем показ через 2 мин 5 с называет время в фоне", () => {
    const page = setup();
    page.at(1000);
    page.visibility("hidden");
    page.at(1000 + 125_000);
    page.visibility("visible");
    expect(page.lines).toEqual([
      "visibilitychange: страница скрыта",
      "visibilitychange: страница снова видна, тёплый возврат, в фоне 2 мин 5 с",
    ]);
    expect(page.saved).toEqual([{ hiddenAt: 1000, unloaded: false }, VISIBLE_PAGE]);
  });

  it("страница, загруженная в фоне, при первом показе называет время от загрузки, а не тёплым возвратом", () => {
    const page = setup(launchPageState("hidden", 0), true);
    page.at(61_000);
    page.visibility("visible");
    expect(page.lines).toEqual([
      "visibilitychange: страница впервые видна, загружена в фоне 1 мин 1 с назад",
    ]);
    expect(page.saved).toEqual([VISIBLE_PAGE]);
  });

  it("страница, загруженная в фоне: после первого показа возврат из фона снова тёплый", () => {
    const page = setup(launchPageState("hidden", 0), true);
    page.at(5000);
    page.visibility("visible");
    page.at(6000);
    page.visibility("hidden");
    page.at(9000);
    page.visibility("visible");
    expect(page.lines.at(-1)).toBe(
      "visibilitychange: страница снова видна, тёплый возврат, в фоне 3 с",
    );
  });

  it("страница, загруженная в фоне и ушедшая в кеш переходов: возврат из него тоже кончает первый показ", () => {
    const page = setup(launchPageState("hidden", 0), true);
    page.at(1000);
    page.hide(true);
    page.at(5000);
    page.show(true);
    page.at(6000);
    page.visibility("hidden");
    page.at(9000);
    page.visibility("visible");
    expect(page.lines.at(-1)).toBe(
      "visibilitychange: страница снова видна, тёплый возврат, в фоне 3 с",
    );
  });

  it("показ без предшествующего ухода не называет длительность", () => {
    const page = setup();
    page.visibility("visible");
    expect(page.lines).toEqual(["visibilitychange: страница видна"]);
  });

  it("на выгрузке pagehide приходит раньше hidden, и hidden не сбрасывает выгрузку", () => {
    const page = setup();
    page.at(1000);
    page.hide(false);
    page.at(1001);
    page.visibility("hidden");
    expect(page.saved).toEqual([
      { hiddenAt: 1000, unloaded: true },
      { hiddenAt: 1000, unloaded: true },
    ]);
  });

  it("два цикла «скрыта – видна» подряд: второй считает фон от своего ухода", () => {
    const page = setup();
    page.at(1000);
    page.visibility("hidden");
    page.at(5000);
    page.visibility("visible");
    page.at(6000);
    page.visibility("hidden");
    page.at(9000);
    page.visibility("visible");
    expect(page.lines.at(-1)).toBe(
      "visibilitychange: страница снова видна, тёплый возврат, в фоне 3 с",
    );
  });

  it("возврат из кеша переходов тоже начинает новый цикл: следующий фон считается заново", () => {
    const page = setup();
    page.at(1000);
    page.hide(true);
    page.at(5000);
    page.show(true);
    page.at(6000);
    page.visibility("hidden");
    page.at(9000);
    page.visibility("visible");
    expect(page.lines.at(-1)).toBe(
      "visibilitychange: страница снова видна, тёплый возврат, в фоне 3 с",
    );
  });

  it("pagehide пишется с persisted и сохраняет выгрузку, не сдвигая прежний уход в фон", () => {
    const page = setup();
    page.at(1000);
    page.visibility("hidden");
    page.at(2000);
    page.hide(false);
    expect(page.lines).toEqual(["visibilitychange: страница скрыта", "pagehide, persisted=false"]);
    expect(page.saved.at(-1)).toEqual({ hiddenAt: 1000, unloaded: true });
  });

  it("pageshow из кеша переходов пишет persisted=true и время в фоне, обычный – только persisted=false", () => {
    const page = setup();
    page.at(1000);
    page.hide(true);
    page.at(1000 + 3_600_000);
    page.show(true);
    page.show(false);
    expect(page.lines).toEqual([
      "pagehide, persisted=true",
      "pageshow, persisted=true, в фоне 1 ч 0 мин 0 с",
      "pageshow, persisted=false",
    ]);
    expect(page.saved.at(-1)).toEqual(VISIBLE_PAGE);
  });
});
