import { type JournalEntry, formatCopy } from "./entries.ts";
import {
  describeLaunch,
  describeLaunchKind,
  launchPageState,
  readPageState,
  watchLifecycle,
  writePageState,
} from "./lifecycle.ts";
import { recordPersistence } from "./persistence.ts";
import { importProbeLog } from "./probe-import.ts";
import { browserStorage } from "./storage.ts";
import { type Log, createJournalStore } from "./store.ts";
import {
  type RegistrationLike,
  describeWorkers,
  trackUpdateCheck,
  watchController,
  watchRegistration,
} from "./worker.ts";

const storage = browserStorage();
const store = createJournalStore(storage, Date.now);

/** Записи от старых к новым. Ссылка меняется только вместе с записями. */
export const getJournalEntries = store.entries;
export const subscribeJournal = store.subscribe;
export const clearJournal = store.clear;

/**
 * Текст для копии записей `entries`: первая строка со сведениями об устройстве и временем снятия
 * (время берётся при вызове), дальше записи по одной на строку.
 */
export function journalCopyText(entries: readonly JournalEntry[]) {
  const now = Date.now();
  return formatCopy(entries, {
    version: __APP_VERSION__,
    takenAt: now,
    offsetMinutes: -new Date(now).getTimezoneOffset(),
    userAgent: navigator.userAgent,
  });
}

// События приложения.

/** Запись события в журнал; не бросает исключений. */
export const writeJournal: Log = (text) => store.append(text);

/** Журнал не должен ломать приложение и соседние шаги: сбой шага остаётся записью. */
function step(name: string, run: () => void) {
  try {
    run();
  } catch (error) {
    try {
      writeJournal(`Сбой журнала на шаге «${name}»: ${String(error)}`);
    } catch {
      // Писать некуда.
    }
  }
}

const isHomeScreen = () =>
  (navigator as Navigator & { standalone?: boolean }).standalone === true ||
  matchMedia("(display-mode: standalone)").matches;

function navigationType() {
  const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return entry?.type ?? "нет данных";
}

/** Запускает журнал; вызывается один раз на странице, до отрисовки приложения. */
export function startJournal() {
  const now = Date.now();
  let movedProbeEntries = 0;
  step("перенос записей пробы", () => {
    movedProbeEntries = importProbeLog(storage, store);
  });
  // Время последней записи читаем до первой записи этого запуска, но после переноса пробы:
  // для первого запуска после пробы это время её последней записи.
  step("запуск", () => {
    const previous = readPageState(storage);
    const lastRecordAt = store.entries().at(-1)?.t;
    writeJournal(
      describeLaunch({
        version: __APP_VERSION__,
        timeOrigin: performance.timeOrigin,
        navigationType: navigationType(),
        visibility: document.visibilityState,
        homeScreen: isHomeScreen(),
      }),
    );
    writeJournal(describeLaunchKind({ previous, lastRecordAt, now }));
    if (movedProbeEntries > 0) writeJournal(`Перенесены записи пробы: ${movedProbeEntries}`);
  });
  step("уходы в фон и возвраты", () => {
    const initial = launchPageState(document.visibilityState, now);
    writePageState(storage, initial);
    watchLifecycle({
      doc: document,
      win: window,
      now: Date.now,
      log: writeJournal,
      initial,
      save: (state) => writePageState(storage, state),
    });
  });
  step("service worker", () => {
    if (navigator.serviceWorker) watchController(navigator.serviceWorker, writeJournal);
    else writeJournal("serviceWorker недоступен");
  });
  step("persist", () => {
    void recordPersistence({
      storage: navigator.storage,
      homeScreen: isHomeScreen(),
      log: writeJournal,
    }).catch((error: unknown) => writeJournal(`Сбой журнала на шаге «persist»: ${String(error)}`));
  });
}

/** Следит за worker регистрации, которую получило приложение. Сбой не ломает регистрацию. */
export function journalRegistration(registration: RegistrationLike) {
  step("регистрация service worker", () => watchRegistration(registration, writeJournal));
}

/** Выполняет проверку обновления `run` и пишет её ход в журнал; результат `run` не меняется. */
export function journalUpdateCheck<T>(
  registration: RegistrationLike,
  reason: string,
  run: () => Promise<T>,
) {
  return trackUpdateCheck(
    { log: writeJournal, now: Date.now, describe: () => describeWorkers(registration) },
    reason,
    run,
  );
}
