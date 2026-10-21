import { type KeyValueStorage, readText, removeKey, writeText } from "../storage/storage.ts";
import {
  type JournalEntry,
  appendEntries,
  normalizeText,
  parseEntries,
  prependEntries,
} from "./entries.ts";

export const JOURNAL_KEY = "app-journal";

/** Приёмник записей журнала: его получают части, которые пишут события. */
export type Log = (text: string) => void;

export interface JournalStore {
  /** Текущие записи; ссылка меняется только вместе с записями – подходит `useSyncExternalStore`. */
  entries: () => readonly JournalEntry[];
  append: (text: string) => void;
  prepend: (older: readonly JournalEntry[]) => void;
  clear: () => void;
  subscribe: (listener: () => void) => () => void;
}

/**
 * Журнал в хранилище. Сбой хранилища не бросает исключение: повреждённые данные заменяются
 * новыми записями, а если писать некуда, записи живут до закрытия страницы.
 */
export function createJournalStore(
  storage: KeyValueStorage | undefined,
  now: () => number,
): JournalStore {
  const listeners = new Set<() => void>();
  // Текст, который хранилище подтвердило последним: прочитанный при создании или записанный.
  let confirmed = readText(storage, JOURNAL_KEY);
  let entries: readonly JournalEntry[] = parseEntries(confirmed ?? null);

  // Перед записью читаем хранилище: другая вкладка могла дописать свои записи. Если там то же,
  // что мы подтвердили, верна память: она может быть новее хранилища, в которое не удалось
  // записать. Если там другое – верно хранилище, а повреждённое даёт пустой журнал.
  const current = () => {
    const text = readText(storage, JOURNAL_KEY);
    return text === undefined || text === confirmed ? entries : parseEntries(text);
  };

  const notify = () => {
    for (const listener of listeners) {
      try {
        listener();
      } catch {
        // Сбой подписчика не должен мешать записи и остальным подписчикам.
      }
    }
  };

  const commit = (next: readonly JournalEntry[]) => {
    entries = next;
    const text = JSON.stringify(next);
    if (writeText(storage, JOURNAL_KEY, text)) confirmed = text;
    notify();
  };

  return {
    entries: () => entries,
    append: (text) => commit(appendEntries(current(), [{ t: now(), text: normalizeText(text) }])),
    prepend: (older) => commit(prependEntries(current(), older)),
    clear: () => {
      entries = [];
      removeKey(storage, JOURNAL_KEY);
      // Подтверждённый текст теперь – пустое хранилище. Без этого `confirmed` остался бы прежним, и
      // если следующая запись не удастся (квота), вторая приняла бы пустое хранилище за правку
      // другой вкладки и потеряла первую.
      confirmed = readText(storage, JOURNAL_KEY);
      notify();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
  };
}
