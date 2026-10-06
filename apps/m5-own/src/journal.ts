// Журнал хранилища: ошибки Dexie и IndexedDB, жизнь приложения, сеть. Лежит в localStorage, а не в IndexedDB:
// если откажет хранилище, журнал должен остаться.
export type Level = "info" | "warn" | "error";
export interface Entry {
  t: number;
  level: Level;
  text: string;
  /** Сколько раз подряд записано то же самое. */
  n: number;
}

let KEY = "lab-journal";
const MAX = 300;
const listeners = new Set<() => void>();

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* журнал не должен ронять приложение */
    }
  },
};
export const lab = storage;

function load(): Entry[] {
  try {
    return JSON.parse(storage.get(KEY) ?? "[]") as Entry[];
  } catch {
    return [];
  }
}
let entries = load();

/** Страница PowerSync живёт на том же источнике, поэтому ведёт свой журнал под другим ключом. */
export function useJournalKey(key: string): void {
  KEY = key;
  entries = load();
}

export const getEntries = () => entries;
export const onJournal = (fn: () => void) => (listeners.add(fn), () => listeners.delete(fn));

export function log(level: Level, text: string): void {
  const last = entries[entries.length - 1];
  if (last && last.text === text && last.level === level && Date.now() - last.t < 60_000) {
    last.n++;
    last.t = Date.now();
  } else {
    entries = [...entries, { t: Date.now(), level, text, n: 1 }].slice(-MAX);
  }
  storage.set(KEY, JSON.stringify(entries));
  listeners.forEach((fn) => fn());
}

export const describe = (error: unknown): string => {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
};
export const logError = (where: string, error: unknown) =>
  log("error", `${where}: ${describe(error)}`);

export function clearJournal(): void {
  entries = [];
  storage.set(KEY, "[]");
  listeners.forEach((fn) => fn());
}

export const formatTime = (t: number): string => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

export const asText = (): string =>
  entries
    .map((e) => `${formatTime(e.t)} ${e.level}${e.n > 1 ? ` ×${e.n}` : ""} ${e.text}`)
    .join("\n");

/** Ошибки, которые никто не поймал: отказ Dexie и «Connection to Indexed Database server lost» приходят сюда. */
export function installGlobalHandlers(): void {
  addEventListener("error", (e) => logError("ошибка окна", e.error ?? e.message));
  addEventListener("unhandledrejection", (e) => logError("необработанный отказ", e.reason));
  addEventListener("online", () => log("info", "сеть: появилась"));
  addEventListener("offline", () => log("warn", "сеть: пропала"));
  addEventListener("pagehide", (e) => {
    storage.set("lab-last-hide", String(Date.now()));
    log("info", `страница уходит (pagehide${e.persisted ? ", в кеше переходов" : ""})`);
  });
  addEventListener(
    "pageshow",
    (e) => e.persisted && log("info", "страница вернулась из кеша переходов"),
  );
  document.addEventListener("visibilitychange", () =>
    log("info", `видимость: ${document.visibilityState}`),
  );
}
