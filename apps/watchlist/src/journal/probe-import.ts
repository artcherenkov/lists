import type { JournalStore } from "./store.ts";

import { type KeyValueStorage, readText, removeKey } from "../storage/storage.ts";
import { parseProbeLog } from "./entries.ts";

// TODO: удалить, когда продуктовая версия хотя бы раз запустится на телефоне автора: записи пробы
// есть только там. Вместе с этим файлом и `probe-import.test.ts` уходят:
// - `parseProbeLog` в `entries.ts` и его тесты в `entries.test.ts`;
// - `JournalStore.prepend` в `store.ts` и `prependEntries` в `entries.ts` с тестами в
//   `entries.test.ts`, а в `store.test.ts` – вызовы `prepend` в тестах «очистка и перенос…» и
//   «подписчик…»: больше никто не ставит записи в начало;
// - шаг «перенос записей пробы», `movedProbeEntries`, запись «Перенесены записи пробы» и пометка
//   «после переноса пробы» у `lastRecordAt` в `journal.ts`;
// - e2e «записи пробы» в `tests/e2e/app/journal.spec.ts`, строки «проба» и «Перенесены записи
//   пробы» в `stories/sample-journal.ts`, упоминания в `docs/testing.md`.
// Запись «Запуск без записанного ухода в фон» остаётся: она нужна и без пробы.
const PROBE_LOG_KEY = "probe-log";
const PROBE_KEYS = [PROBE_LOG_KEY, "probe-state", "probe-marker-seen"];

/** Забирает записи пробы вехи 4 в начало журнала и удаляет ключи пробы. Возвращает число записей. */
export function importProbeLog(storage: KeyValueStorage | undefined, store: JournalStore) {
  const entries = parseProbeLog(readText(storage, PROBE_LOG_KEY) ?? null);
  if (entries.length > 0) store.prepend(entries);
  for (const key of PROBE_KEYS) removeKey(storage, key);
  return entries.length;
}
