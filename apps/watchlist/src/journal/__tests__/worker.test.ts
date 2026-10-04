import { afterEach, describe, expect, it, vi } from "vitest";

import {
  describeWorkers,
  trackUpdateCheck,
  watchController,
  watchRegistration,
  type RegistrationLike,
} from "../worker.ts";

type FakeWorker = EventTarget & { state: ServiceWorkerState };

const worker = (state: ServiceWorkerState): FakeWorker =>
  Object.assign(new EventTarget(), { state });

function changeState(w: FakeWorker, state: ServiceWorkerState) {
  w.state = state;
  w.dispatchEvent(new Event("statechange"));
}

// Порядок и состояние, как выставляет браузер (Service Workers, Install и Activate): к событию
// `installed` устанавливаемый worker уже лежит в `waiting`, к `activating` он уже `active`.
function install(reg: RegistrationLike, w: FakeWorker) {
  Object.assign(reg, { waiting: w, installing: null });
  changeState(w, "installed");
}

function activate(reg: RegistrationLike, w: FakeWorker) {
  Object.assign(reg, { active: w, waiting: null });
  changeState(w, "activating");
  changeState(w, "activated");
}

function registration(parts: Partial<Record<"active" | "waiting" | "installing", FakeWorker>>) {
  return Object.assign(new EventTarget(), {
    active: null,
    waiting: null,
    installing: null,
    ...parts,
  }) as RegistrationLike & EventTarget;
}

function watch(reg: RegistrationLike) {
  const lines: string[] = [];
  watchRegistration(reg, (text) => lines.push(text));
  return lines;
}

describe("watchRegistration", () => {
  it("пишет регистрацию с состояниями worker", () => {
    expect(describeWorkers(registration({ active: worker("activated") }))).toBe(
      "active=activated, waiting=нет, installing=нет",
    );
    expect(watch(registration({ active: worker("activated") }))).toEqual([
      "Регистрация service worker получена: active=activated, waiting=нет, installing=нет",
    ]);
  });

  it("ждущий worker есть при запуске: пишется, а его включение видно", () => {
    const waiting = worker("installed");
    const reg = registration({ active: worker("activated"), waiting });
    const lines = watch(reg);
    expect(lines).toContain("Ждущая версия уже есть при запуске");
    activate(reg, waiting);
    expect(lines.slice(-2)).toEqual(["Версия включается", "Версия включилась"]);
  });

  it("новая версия: найдена, установлена и ждёт, включается, включилась", () => {
    const reg = registration({ active: worker("activated") });
    const lines = watch(reg);
    lines.length = 0;
    const installing = worker("installing");
    Object.assign(reg, { installing });
    reg.dispatchEvent(new Event("updatefound"));
    install(reg, installing);
    activate(reg, installing);
    expect(lines).toEqual([
      "Найдена новая версия (updatefound)",
      "Новая версия установлена и ждёт включения",
      "Версия включается",
      "Версия включилась",
    ]);
  });

  it("первое открытие: worker уже устанавливается, когда приложение получило регистрацию", () => {
    const installing = worker("installing");
    const reg = registration({ installing });
    const lines = watch(reg);
    expect(lines).toContain("Версия устанавливается при запуске");
    install(reg, installing);
    activate(reg, installing);
    expect(lines.slice(-3)).toEqual([
      "Первая версия установлена",
      "Версия включается",
      "Версия включилась",
    ]);
  });

  it("первая установка после updatefound называется первой версией, а не новой, которая ждёт включения", () => {
    const reg = registration({});
    const lines = watch(reg);
    const installing = worker("installing");
    Object.assign(reg, { installing });
    reg.dispatchEvent(new Event("updatefound"));
    install(reg, installing);
    activate(reg, installing);
    expect(lines.slice(1)).toEqual([
      "Найден первый worker (updatefound, прежнего нет)",
      "Первая версия установлена",
      "Версия включается",
      "Версия включилась",
    ]);
  });

  it("первый worker без прежнего называется первым", () => {
    const reg = registration({});
    const lines = watch(reg);
    Object.assign(reg, { installing: worker("installing") });
    reg.dispatchEvent(new Event("updatefound"));
    expect(lines.at(-1)).toBe("Найден первый worker (updatefound, прежнего нет)");
  });

  it("отброшенный worker записывается", () => {
    const installing = worker("installing");
    const lines = watch(registration({ installing }));
    changeState(installing, "redundant");
    expect(lines.at(-1)).toBe("Версия отброшена (redundant)");
  });

  it("worker, найденный при запуске и затем через updatefound, пишется один раз", () => {
    const installing = worker("installing");
    const reg = registration({ active: worker("activated"), installing });
    const lines = watch(reg);
    reg.dispatchEvent(new Event("updatefound"));
    changeState(installing, "activating");
    expect(lines.filter((x) => x === "Версия включается")).toHaveLength(1);
  });

  it("повторный вызов с той же регистрацией не дублирует записи", () => {
    const reg = registration({ active: worker("activated") });
    const lines: string[] = [];
    watchRegistration(reg, (text) => lines.push(text));
    watchRegistration(reg, (text) => lines.push(text));
    expect(lines).toHaveLength(1);
    Object.assign(reg, { installing: worker("installing") });
    reg.dispatchEvent(new Event("updatefound"));
    expect(lines.filter((x) => x.startsWith("Найдена"))).toHaveLength(1);
  });
});

describe("watchController", () => {
  it("пишет controller при запуске и каждую смену", () => {
    const container = Object.assign(new EventTarget(), { controller: null }) as EventTarget & {
      controller: { state: ServiceWorkerState } | null;
    };
    const lines: string[] = [];
    watchController(container, (text) => lines.push(text));
    container.controller = { state: "activated" };
    container.dispatchEvent(new Event("controllerchange"));
    expect(lines).toEqual(["controller при запуске: нет", "Сменился controller: activated"]);
  });

  it("есть controller при запуске", () => {
    const container = Object.assign(new EventTarget(), { controller: { state: "activated" } });
    const lines: string[] = [];
    watchController(container as never, (text) => lines.push(text));
    expect(lines).toEqual(["controller при запуске: activated"]);
  });
});

describe("trackUpdateCheck", () => {
  afterEach(() => vi.useRealTimers());

  function track<T>(run: () => Promise<T>) {
    const lines: string[] = [];
    let now = 0;
    const result = trackUpdateCheck(
      { log: (text) => lines.push(text), now: () => now, describe: () => "active=activated" },
      "раз в час",
      run,
    );
    return { lines, result, at: (ms: number) => void (now = ms) };
  }

  it("пишет начало и завершение со временем проверки и возвращает результат проверки", async () => {
    vi.useFakeTimers();
    let finish!: (value: string) => void;
    const t = track(() => new Promise<string>((resolve) => (finish = resolve)));
    expect(t.lines).toEqual(["Проверка обновления начата (раз в час)"]);
    t.at(3000);
    finish("готово");
    await expect(t.result).resolves.toBe("готово");
    expect(t.lines).toEqual([
      "Проверка обновления начата (раз в час)",
      "Проверка обновления завершена за 3 с; active=activated",
    ]);
  });

  it("ошибка проверки пишется и передаётся дальше тем же отказом", async () => {
    vi.useFakeTimers();
    const failure = new TypeError("Failed to fetch");
    const t = track(() => Promise.reject(failure));
    await expect(t.result).rejects.toBe(failure);
    expect(t.lines.at(-1)).toBe(
      "Проверка обновления закончилась ошибкой: TypeError: Failed to fetch",
    );
    await vi.advanceTimersByTimeAsync(30_000);
    expect(t.lines).toHaveLength(2);
  });

  it("проверка, не завершившаяся за 20 с, пишется один раз, а позднее завершение тоже", async () => {
    vi.useFakeTimers();
    let finish!: () => void;
    const t = track(() => new Promise<void>((resolve) => (finish = resolve)));
    await vi.advanceTimersByTimeAsync(19_999);
    expect(t.lines).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(t.lines.at(-1)).toBe(
      "Проверка обновления не завершилась за 20 с (раз в час); active=activated",
    );
    await vi.advanceTimersByTimeAsync(60_000);
    t.at(80_000);
    finish();
    await t.result;
    expect(t.lines).toHaveLength(3);
    expect(t.lines.at(-1)).toBe("Проверка обновления завершена за 1 мин 20 с; active=activated");
  });

  it("завершённая вовремя проверка не оставляет таймер зависания", async () => {
    vi.useFakeTimers();
    const t = track(() => Promise.resolve());
    await t.result;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(t.lines).toHaveLength(2);
  });
});
