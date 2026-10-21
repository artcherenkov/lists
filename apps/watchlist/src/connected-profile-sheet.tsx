import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import {
  clearJournal,
  getJournalEntries,
  journalCopyText,
  subscribeJournal,
} from "./journal/journal.ts";
import { ProfileSheet } from "./screens/profile-sheet.tsx";
import { signOut } from "./session/session.ts";

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

/**
 * Профиль, подключённый к журналу приложения и входу: подписка на записи живёт, пока шторка
 * открыта. Экран получает записи и действия свойствами, поэтому Storybook подставляет свои.
 */
export function ConnectedProfileSheet({
  accountName,
  onClosed,
}: {
  accountName: string;
  onClosed: () => void;
}) {
  const entries = useSyncExternalStore(subscribeJournal, getJournalEntries);
  // Время «снят» в первой строке – когда экран показал этот текст: при открытии и с новой записью.
  const text = useMemo(() => journalCopyText(entries), [entries]);
  const [signingOut, setSigningOut] = useState(false);

  // Удачный выход сменит экран на вход, и шторка исчезнет вместе со списком.
  const signOutOfAccount = async () => {
    setSigningOut(true);
    if (await signOut()) return;
    setSigningOut(false);
    toast("Выйти не удалось: сервер не ответил. Попробуйте ещё раз.");
  };

  return (
    <ProfileSheet
      account={{ name: accountName, signingOut, onSignOut: () => void signOutOfAccount() }}
      version={__APP_VERSION__}
      journal={{ text, entryCount: entries.length, onCopy: copyToClipboard, onClear: clearJournal }}
      onClosed={onClosed}
    />
  );
}
