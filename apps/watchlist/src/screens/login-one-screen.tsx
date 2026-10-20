import type { LoginScreenProps } from "./login-view.ts";
import type { ReactNode } from "react";

import { Button } from "@lists/ui/components/ui/button";
import { cn } from "@lists/ui/lib/utils";
import { CheckIcon, LoaderCircleIcon, SendIcon } from "lucide-react";

import { LoginCodeField } from "./login-code-field.tsx";
import { AppIcon, LoginProblemText } from "./login-parts.tsx";
import { CODE_LENGTH } from "./login-view.ts";

/**
 * Вариант A «Один экран»: оба шага видны сразу и пронумерованы – «получите код» и «введите
 * код». Главная кнопка переходит от шага к шагу: без кода – бот, после возврата из Telegram –
 * «Войти», после истёкшей попытки – снова бот.
 */
export function LoginOneScreen({
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
  const botIsMain = !codeSent || needsNewLink;
  const codeComplete = code.length === CODE_LENGTH;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(max(1rem,env(safe-area-inset-top))+1rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <AppIcon className="mb-3 size-12" />
        <h1 className="font-heading text-2xl font-medium">Вотчлист</h1>
        <p className="mt-1 text-muted-foreground">Вход через Telegram, без пароля.</p>
      </header>

      <ol className="grid gap-3">
        <Step
          mark={codeSent && !needsNewLink ? "done" : 1}
          highlighted={botIsMain}
          title={codeSent && !needsNewLink ? "Код у вас в Telegram" : "Получите код у бота"}
          description={
            codeSent && !needsNewLink
              ? "Не пришёл – откройте бота ещё раз."
              : `Откроется Telegram, бот ${botName} пришлёт 6 цифр.`
          }
        >
          <Button
            variant={botIsMain ? "default" : "outline"}
            className={cn("w-full text-base", botIsMain ? "h-12" : "h-11")}
            onClick={onOpenBot}
          >
            <SendIcon />
            {botLabel(codeSent, needsNewLink)}
          </Button>
        </Step>

        <Step
          mark={2}
          highlighted={!botIsMain}
          title="Введите код"
          description="6 цифр из сообщения бота."
        >
          <LoginCodeField
            size="md"
            value={code}
            onChange={onCodeChange}
            onComplete={onSubmit}
            invalid={problem?.fix === "retype"}
            disabled={checking || needsNewLink}
          />
          {problem && <LoginProblemText problem={problem} className="mt-3" />}
          <Button
            variant={botIsMain ? "secondary" : "default"}
            className="mt-4 h-12 w-full text-base"
            disabled={checking || needsNewLink || problem?.fix === "wait" || !codeComplete}
            onClick={problem?.fix === "retry" ? onRetry : () => onSubmit(code)}
          >
            {checking && <LoaderCircleIcon className="animate-spin" />}
            {checking ? "Проверяем код" : problem?.fix === "retry" ? "Повторить" : "Войти"}
          </Button>
        </Step>
      </ol>
    </main>
  );
}

function botLabel(codeSent: boolean, needsNewLink: boolean) {
  if (needsNewLink) return "Получить новый код";
  return codeSent ? "Открыть бота ещё раз" : "Открыть бота в Telegram";
}

/** Шаг в карточке: номер или галочка, заголовок, пояснение и действия шага. */
function Step({
  mark,
  highlighted,
  title,
  description,
  children,
}: {
  mark: number | "done";
  /** Шаг, который нужно сделать сейчас: номер залит. */
  highlighted: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border bg-card p-4 text-card-foreground">
      <div className="flex gap-3">
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            highlighted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {mark === "done" ? <CheckIcon className="size-4" /> : mark}
        </span>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-medium">{title}</h2>
          <p className="mt-0.5 text-sm text-pretty text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </li>
  );
}
