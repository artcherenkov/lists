import type { LoginScreenProps } from "./login-view.ts";

import { Button } from "@lists/ui/components/ui/button";
import { cn } from "@lists/ui/lib/utils";
import { ClipboardPasteIcon, DeleteIcon, LoaderCircleIcon, SendIcon } from "lucide-react";
import { useEffect, useEffectEvent } from "react";

import { AppIcon, LoginProblemText } from "./login-parts.tsx";
import { CODE_LENGTH } from "./login-view.ts";

const DIGIT_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
] as const;

const CELL_INDEXES = Array.from({ length: CODE_LENGTH }, (_, index) => index);

/**
 * Вариант C «Код главный»: экран – поле кода и своя цифровая клавиатура, как экран ПИН-кода
 * в банке. Системная клавиатура не нужна: после возврата из Telegram, даже после перезагрузки,
 * цифры набираются сразу, без касания поля. Бот – вторичная кнопка под полем. Шестая цифра
 * отправляет код.
 */
export function LoginKeypad({
  botName,
  codeSent,
  code,
  checking,
  problem,
  onOpenBot,
  onCodeChange,
  onSubmit,
  onRetry,
}: LoginScreenProps) {
  const needsNewLink = problem?.fix === "new-link";
  const keypadOff = checking || needsNewLink || problem?.fix === "wait";

  const enter = (digits: string) => {
    if (keypadOff) return;
    // После неверного кода первая цифра начинает новый: стирать старый по одной незачем.
    const base = problem?.fix === "retype" ? "" : code;
    const next = (base + digits).slice(0, CODE_LENGTH);
    onCodeChange(next);
    if (next.length === CODE_LENGTH) onSubmit(next);
  };

  const erase = () => {
    if (!keypadOff) onCodeChange(code.slice(0, -1));
  };

  // Отказ в доступе к буферу – обычный исход на iOS: человек не нажал «Вставить».
  const paste = () => {
    navigator.clipboard.readText().then(
      (text) => enter(text.replace(/\D/g, "")),
      () => {},
    );
  };

  // На компьютере код набирают обычной клавиатурой.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (/^\d$/.test(event.key)) enter(event.key);
    else if (event.key === "Backspace") erase();
  });
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(max(1rem,env(safe-area-inset-top))+0.75rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="flex items-center gap-2.5">
        <AppIcon className="size-8" />
        <span className="font-medium">Вотчлист</span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center py-6 text-center">
        <h1 className="font-heading text-2xl font-medium">Код из Telegram</h1>
        <p className="mt-2 text-sm text-balance text-muted-foreground">
          {codeSent ? `Бот ${botName} прислал 6 цифр` : `Бот ${botName} пришлёт 6 цифр`}
        </p>

        <CodeCells
          code={code}
          invalid={problem?.fix === "retype"}
          dimmed={needsNewLink}
          waiting={keypadOff}
          checking={checking}
        />

        <div className="mt-4 flex min-h-10 items-start justify-center">
          {problem ? (
            <LoginProblemText problem={problem} className="text-left" />
          ) : checking ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircleIcon className="size-4 animate-spin" />
              Проверяем код
            </p>
          ) : null}
        </div>

        {problem?.fix === "retry" ? (
          <Button className="mt-2 h-10 rounded-full px-5" onClick={onRetry}>
            Повторить
          </Button>
        ) : (
          <Button
            variant={needsNewLink ? "default" : "outline"}
            className="mt-2 h-10 rounded-full px-4"
            onClick={onOpenBot}
          >
            <SendIcon />
            {needsNewLink
              ? "Получить новый код"
              : codeSent
                ? "Открыть бота ещё раз"
                : "Получить код в Telegram"}
          </Button>
        )}
      </section>

      <div
        className={cn("grid grid-cols-3 gap-2", keypadOff && "pointer-events-none opacity-40")}
        aria-disabled={keypadOff || undefined}
      >
        {DIGIT_ROWS.flat().map((digit) => (
          <DigitKey key={digit} digit={digit} onPress={enter} />
        ))}
        <Button
          variant="ghost"
          className="h-14 flex-col gap-0.5 rounded-2xl text-xs font-normal text-muted-foreground"
          onClick={paste}
        >
          <ClipboardPasteIcon className="size-5" />
          Вставить
        </Button>
        <DigitKey digit="0" onPress={enter} />
        <Button
          variant="ghost"
          aria-label="Стереть цифру"
          className="h-14 rounded-2xl"
          onClick={erase}
        >
          <DeleteIcon className="size-6" />
        </Button>
      </div>
    </main>
  );
}

function DigitKey({ digit, onPress }: { digit: string; onPress: (digit: string) => void }) {
  return (
    <Button
      variant="secondary"
      className="h-14 rounded-2xl text-2xl font-normal tabular-nums"
      onClick={() => onPress(digit)}
    >
      {digit}
    </Button>
  );
}

/** Шесть клеток кода; следующая пустая обведена – туда встанет цифра. */
function CodeCells({
  code,
  invalid,
  dimmed,
  waiting,
  checking,
}: {
  code: string;
  invalid: boolean;
  dimmed: boolean;
  /** Клавиатура выключена: следующую клетку не обводим. */
  waiting: boolean;
  checking: boolean;
}) {
  return (
    <div
      role="status"
      aria-label={`Введено цифр: ${code.length} из ${CODE_LENGTH}`}
      className={cn(
        "mt-6 flex w-full max-w-80 gap-2",
        dimmed && "opacity-40",
        checking && "animate-pulse",
      )}
    >
      {CELL_INDEXES.map((index) => (
        <span
          key={index}
          className={cn(
            "flex h-14 min-w-0 flex-1 items-center justify-center rounded-xl border border-input text-2xl font-medium tabular-nums dark:bg-input/30",
            index === code.length && !invalid && !waiting && "border-ring ring-3 ring-ring/50",
            invalid && "border-destructive text-destructive",
          )}
        >
          {code[index]}
        </span>
      ))}
    </div>
  );
}
