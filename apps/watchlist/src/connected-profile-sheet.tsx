import { useMemo, useSyncExternalStore } from "react";

import {
  clearJournal,
  getJournalEntries,
  journalCopyText,
  subscribeJournal,
} from "./journal/journal.ts";
import { ProfileSheet } from "./screens/profile-sheet.tsx";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

/**
 * Профиль, подключённый к журналу приложения: подписка на записи живёт, пока шторка открыта.
 * Экран получает записи и действия свойствами, поэтому Storybook подставляет свои.
 */
export function ConnectedProfileSheet({ onClosed }: { onClosed: () => void }) {
  const entries = useSyncExternalStore(subscribeJournal, getJournalEntries);
  // Время «снят» в первой строке – когда экран показал этот текст: при открытии и с новой записью.
  const text = useMemo(() => journalCopyText(entries), [entries]);

  return (
    <ProfileSheet
      version={__APP_VERSION__}
      journal={{ text, entryCount: entries.length, onCopy: copyToClipboard, onClear: clearJournal }}
      onClosed={onClosed}
    />
  );
}
