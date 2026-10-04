import { Button } from "@lists/ui/components/ui/button";
import { CheckIcon, ChevronLeftIcon, CopyIcon, Trash2Icon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const COPIED_MS = 2500;
const CONFIRM_CLEAR_MS = 3500;

/** Значение, которое само пропадает через `ms`; новое значение начинает отсчёт заново. */
function useTemporary<T>(ms: number) {
  const [value, setValue] = useState<T>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (next: T) => {
    clearTimeout(timer.current);
    setValue(next);
    timer.current = setTimeout(() => setValue(undefined), ms);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setValue(undefined);
  };
  return [value, show, hide] as const;
}

/** Верх экрана журнала: «‹ Профиль» возвращает к профилю. */
export function JournalHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative flex h-11 items-center justify-center pt-1 pb-2">
      <button
        type="button"
        onClick={onBack}
        className="absolute left-0 flex h-11 items-center gap-0.5 rounded-lg pr-3 text-base"
      >
        <ChevronLeftIcon className="size-6" />
        Профиль
      </button>
      <h2 className="font-heading text-base font-medium">Журнал</h2>
    </div>
  );
}

/**
 * «Скопировать журнал» и «Очистить». Ответ копирования – надпись на кнопке, очистка срабатывает
 * со второго нажатия. Монтируется на время показа журнала: уход с экрана сбрасывает ответы.
 */
export function JournalFooter({
  text,
  entryCount,
  onCopy,
  onClear,
  onCopyFailed,
}: {
  /** Текст копии: то же, что показано на экране. */
  text: string;
  entryCount: number;
  /** Кладёт `text` в буфер обмена; отказ платформы – отклонённое обещание. */
  onCopy: (text: string) => Promise<void>;
  onClear: () => void;
  /** Копирование не вышло: экран выделяет текст журнала, чтобы его скопировали руками. */
  onCopyFailed: () => void;
}) {
  const [copiedCount, showCopied, hideCopied] = useTemporary<number>(COPIED_MS);
  const [confirmingClear, showConfirmingClear, hideConfirmingClear] =
    useTemporary<true>(CONFIRM_CLEAR_MS);
  const [copyFailed, setCopyFailed] = useState(false);
  const isEmpty = entryCount === 0;

  const copy = () => {
    onCopy(text).then(
      () => {
        setCopyFailed(false);
        showCopied(entryCount);
      },
      () => {
        setCopyFailed(true);
        onCopyFailed();
      },
    );
  };

  const clear = () => {
    if (!confirmingClear) {
      showConfirmingClear(true);
      return;
    }
    hideConfirmingClear();
    hideCopied();
    setCopyFailed(false);
    onClear();
  };

  return (
    <div className="grid gap-1.5 pt-2">
      <div className="flex gap-2">
        <Button
          size="lg"
          className="h-12 min-w-0 flex-1 gap-2 text-base"
          onClick={copy}
          disabled={isEmpty}
        >
          {copiedCount === undefined ? (
            <CopyIcon className="size-5" />
          ) : (
            <CheckIcon className="size-5" />
          )}
          {copiedCount === undefined ? "Скопировать журнал" : `Скопировано · ${copiedCount}`}
        </Button>
        <Button
          size="lg"
          variant={confirmingClear ? "destructive" : "secondary"}
          className="h-12 shrink-0 gap-2 px-4 text-base"
          onClick={clear}
          disabled={isEmpty}
        >
          <Trash2Icon className="size-5 max-xs:hidden" />
          {confirmingClear ? "Точно?" : "Очистить"}
        </Button>
      </div>
      <p role="status" className="min-h-4 text-xs text-destructive">
        {copyFailed ? "Не удалось скопировать: текст выделен, скопируйте его вручную" : ""}
      </p>
    </div>
  );
}
