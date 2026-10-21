import { Button } from "@lists/ui/components/ui/button";
import { ChevronRightIcon, LoaderCircleIcon } from "lucide-react";
import { useRef, useState } from "react";

import { AppSheet } from "./app-sheet.tsx";
import { JournalFooter, JournalHeader } from "./journal-controls.tsx";
import { JournalLog, selectContents } from "./journal-log.tsx";
import { useClosingSheet } from "./use-closing-sheet.ts";

export interface ProfileJournal {
  /** Текст копии: первая строка со сведениями об устройстве, дальше записи по одной на строку. */
  text: string;
  entryCount: number;
  /** Кладёт `text` в буфер обмена; отказ платформы – отклонённое обещание. */
  onCopy: (text: string) => Promise<void>;
  onClear: () => void;
}

export interface ProfileAccount {
  /** Имя из Telegram. */
  name: string;
  /** Выход начат, сервер ещё не ответил. */
  signingOut: boolean;
  onSignOut: () => void;
}

/**
 * Профиль: кто вошёл и выход, номер версии и вход в журнал приложения. Журнал сменяет содержимое
 * этой же шторки, «‹ Профиль» возвращает назад, свайп вниз закрывает шторку целиком. Монтируется
 * на время показа.
 */
export function ProfileSheet({
  account,
  version,
  journal,
  onClosed,
}: {
  account: ProfileAccount;
  /** Готовая строка, например «2026-10-02 · d5c28ef». */
  version: string;
  journal: ProfileJournal;
  /** Шторка доехала вниз: родитель её размонтирует. */
  onClosed: () => void;
}) {
  const { open, close } = useClosingSheet();
  const [journalShown, setJournalShown] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const selectLog = () => {
    if (logRef.current) selectContents(logRef.current);
  };

  return (
    <AppSheet
      open={open}
      onClose={close}
      onClosed={onClosed}
      title={journalShown ? "Журнал приложения" : "Профиль"}
      header={journalShown ? <JournalHeader onBack={() => setJournalShown(false)} /> : undefined}
      footer={
        journalShown ? (
          <JournalFooter
            text={journal.text}
            entryCount={journal.entryCount}
            onCopy={journal.onCopy}
            onClear={journal.onClear}
            onCopyFailed={selectLog}
          />
        ) : undefined
      }
    >
      {journalShown ? (
        <JournalLog ref={logRef} text={journal.text} entryCount={journal.entryCount} />
      ) : (
        <div className="grid gap-4 pt-2 pb-4">
          <h2 className="font-heading text-xl font-medium">Профиль</h2>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 py-2 pr-2 pl-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Вы вошли как</p>
              <p className="truncate text-base">{account.name}</p>
            </div>
            <Button
              variant="outline"
              className="h-10 px-4 text-base"
              disabled={account.signingOut}
              onClick={account.onSignOut}
            >
              {account.signingOut && <LoaderCircleIcon className="animate-spin" />}
              Выйти
            </Button>
          </div>
          <dl className="grid gap-1">
            <dt className="text-sm text-muted-foreground">Версия</dt>
            <dd className="text-base">{version}</dd>
          </dl>
          <button
            type="button"
            onClick={() => setJournalShown(true)}
            className="flex h-12 items-center justify-between rounded-xl bg-muted/60 px-4 text-left text-base"
          >
            Журнал приложения
            <ChevronRightIcon className="size-5 text-muted-foreground" />
          </button>
        </div>
      )}
    </AppSheet>
  );
}
