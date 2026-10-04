import type { JournalStore } from "./store.ts";

import { parseProbeLog } from "./entries.ts";
import { type KeyValueStorage, readText, removeKey } from "./storage.ts";

// TODO: удалить этот файл, `parseProbeLog` в `entries.ts` и вызов в `journal.ts`, когда продуктовая
// версия хотя бы раз запустится на телефоне автора: записи пробы есть только там.
const PROBE_LOG_KEY = "probe-log";
const PROBE_KEYS = [PROBE_LOG_KEY, "probe-state", "probe-marker-seen"];

/** Забирает записи пробы вехи 4 в начало журнала и удаляет ключи пробы. Возвращает число записей. */
export function importProbeLog(storage: KeyValueStorage | undefined, store: JournalStore) {
  const entries = parseProbeLog(readText(storage, PROBE_LOG_KEY) ?? null);
  if (entries.length > 0) store.prepend(entries);
  for (const key of PROBE_KEYS) removeKey(storage, key);
  return entries.length;
}
