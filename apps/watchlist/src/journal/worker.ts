import type { Log } from "./store.ts";

import { formatDuration } from "./format.ts";

export const UPDATE_CHECK_WATCHDOG_MS = 20_000;

interface WorkerLike extends EventTarget {
  state: ServiceWorkerState;
}

export interface RegistrationLike extends EventTarget {
  active: WorkerLike | null;
  waiting: WorkerLike | null;
  installing: WorkerLike | null;
}

export interface ControllerContainerLike extends EventTarget {
  controller: { state: ServiceWorkerState } | null;
}

const state = (worker: WorkerLike | null) => worker?.state ?? "нет";

export function describeWorkers(registration: RegistrationLike) {
  return `active=${state(registration.active)}, waiting=${state(registration.waiting)}, installing=${state(registration.installing)}`;
}

const watchedWorkers = new WeakSet<WorkerLike>();
const watchedRegistrations = new WeakSet<RegistrationLike>();

function watchWorker(registration: RegistrationLike, worker: WorkerLike, log: Log) {
  if (watchedWorkers.has(worker)) return;
  watchedWorkers.add(worker);
  worker.addEventListener("statechange", () => {
    switch (worker.state) {
      case "installed":
        // К `installed` worker всегда лежит в `waiting`, и при первой установке тоже: новую версию
        // от первой отличает только прежний активный worker.
        log(
          registration.active
            ? "Новая версия установлена и ждёт включения"
            : "Первая версия установлена",
        );
        break;
      case "activating":
        log("Версия включается");
        break;
      case "activated":
        log("Версия включилась");
        break;
      case "redundant":
        log("Версия отброшена (redundant)");
        break;
    }
  });
}

/**
 * Следит за worker регистрации. Вызывать там, где приложение получает регистрацию: worker
 * первого открытия уже может устанавливаться, а ждущий – ждать.
 */
export function watchRegistration(registration: RegistrationLike, log: Log) {
  if (watchedRegistrations.has(registration)) return;
  watchedRegistrations.add(registration);
  log(`Регистрация service worker получена: ${describeWorkers(registration)}`);
  if (registration.waiting) {
    log("Ждущая версия уже есть при запуске");
    watchWorker(registration, registration.waiting, log);
  }
  if (registration.installing) {
    log("Версия устанавливается при запуске");
    watchWorker(registration, registration.installing, log);
  }
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    log(
      registration.active
        ? "Найдена новая версия (updatefound)"
        : "Найден первый worker (updatefound, прежнего нет)",
    );
    if (worker) watchWorker(registration, worker, log);
  });
}

export function watchController(container: ControllerContainerLike, log: Log) {
  log(`controller при запуске: ${container.controller ? container.controller.state : "нет"}`);
  container.addEventListener("controllerchange", () =>
    log(`Сменился controller: ${container.controller ? container.controller.state : "нет"}`),
  );
}

export interface UpdateCheckDeps {
  log: Log;
  now: () => number;
  describe: () => string;
}

/** Выполняет проверку обновления и пишет, как она началась и чем кончилась. Результат `run` не меняется. */
export function trackUpdateCheck<T>(deps: UpdateCheckDeps, reason: string, run: () => Promise<T>) {
  const { log, now, describe } = deps;
  const startedAt = now();
  log(`Проверка обновления начата (${reason})`);
  const check = run();
  const watchdog = setTimeout(
    () =>
      log(
        `Проверка обновления не завершилась за ${UPDATE_CHECK_WATCHDOG_MS / 1000} с (${reason}); ${describe()}`,
      ),
    UPDATE_CHECK_WATCHDOG_MS,
  );
  check.then(
    () => {
      clearTimeout(watchdog);
      log(`Проверка обновления завершена за ${formatDuration(now() - startedAt)}; ${describe()}`);
    },
    (error: unknown) => {
      clearTimeout(watchdog);
      log(`Проверка обновления закончилась ошибкой: ${String(error)}`);
    },
  );
  return check;
}
