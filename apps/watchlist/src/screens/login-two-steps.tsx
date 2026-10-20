import type { LoginScreenProps } from "./login-view.ts";

import { Button } from "@lists/ui/components/ui/button";
import { ChevronLeftIcon, LoaderCircleIcon, SendIcon } from "lucide-react";
import { useState } from "react";

import { LoginCodeField } from "./login-code-field.tsx";
import { AppIcon, LoginProblemText } from "./login-parts.tsx";
import { CODE_LENGTH } from "./login-view.ts";

const SAFE_PADDING =
  "pt-[calc(max(1rem,env(safe-area-inset-top))+0.5rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]";

/**
 * Вариант B «Два шага»: сначала экран с одной кнопкой – открыть бота, потом отдельный экран
 * ввода кода. После возврата из Telegram, и после перезагрузки тоже, сразу виден второй шаг.
 */
export function LoginTwoSteps(props: LoginScreenProps) {
  const [step, setStep] = useState<"start" | "code">(props.codeSent ? "code" : "start");

  // Второй шаг открывается в том же нажатии: человек вернётся из Telegram уже к полю кода.
  const openBot = () => {
    props.onOpenBot();
    setStep("code");
  };

  return step === "start" ? (
    <StartStep botName={props.botName} onOpenBot={openBot} onHaveCode={() => setStep("code")} />
  ) : (
    <CodeStep {...props} onOpenBot={openBot} onBack={() => setStep("start")} />
  );
}

function StartStep({
  botName,
  onOpenBot,
  onHaveCode,
}: {
  botName: string;
  onOpenBot: () => void;
  onHaveCode: () => void;
}) {
  return (
    <main className={`mx-auto flex min-h-dvh max-w-md flex-col px-6 ${SAFE_PADDING}`}>
      <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
        <AppIcon className="size-24" />
        <h1 className="mt-6 font-heading text-3xl font-medium">Вотчлист</h1>
        <p className="mt-3 max-w-72 text-balance text-muted-foreground">
          Вход через Telegram: бот {botName} пришлёт код, а вы введёте его здесь.
        </p>
      </div>
      <div className="grid gap-2">
        <Button className="h-12 w-full text-base" onClick={onOpenBot}>
          <SendIcon />
          Получить код в Telegram
        </Button>
        <Button variant="ghost" className="h-12 w-full text-base" onClick={onHaveCode}>
          У меня уже есть код
        </Button>
      </div>
    </main>
  );
}

function CodeStep({
  botName,
  codeSent,
  code,
  checking,
  problem,
  onOpenBot,
  onCodeChange,
  onSubmit,
  onRetry,
  onBack,
}: LoginScreenProps & { onBack: () => void }) {
  const needsNewLink = problem?.fix === "new-link";

  return (
    <main className={`mx-auto flex min-h-dvh max-w-md flex-col px-6 ${SAFE_PADDING}`}>
      <div className="-ml-3">
        <Button variant="ghost" className="h-10 px-2 text-base" onClick={onBack}>
          <ChevronLeftIcon className="size-5" />
          Назад
        </Button>
      </div>

      <h1 className="mt-4 font-heading text-2xl font-medium">Введите код</h1>
      <p className="mt-2 text-pretty text-muted-foreground">
        {!codeSent
          ? `6 цифр из сообщения бота ${botName}.`
          : needsNewLink
            ? `Бот ${botName} присылал его в Telegram.`
            : `Бот ${botName} прислал его в Telegram. Код действует 10 минут.`}
      </p>

      <div className="mt-8">
        <LoginCodeField
          size="lg"
          value={code}
          onChange={onCodeChange}
          onComplete={onSubmit}
          invalid={problem?.fix === "retype"}
          disabled={checking || needsNewLink}
        />
      </div>
      {problem && <LoginProblemText problem={problem} className="mt-4" />}

      {needsNewLink ? (
        <Button className="mt-6 h-12 w-full text-base" onClick={onOpenBot}>
          <SendIcon />
          Получить новый код
        </Button>
      ) : (
        <Button
          className="mt-6 h-12 w-full text-base"
          disabled={checking || problem?.fix === "wait" || code.length < CODE_LENGTH}
          onClick={problem?.fix === "retry" ? onRetry : () => onSubmit(code)}
        >
          {checking && <LoaderCircleIcon className="animate-spin" />}
          {checking ? "Проверяем код" : problem?.fix === "retry" ? "Повторить" : "Войти"}
        </Button>
      )}

      {!needsNewLink && (
        <p className="mt-auto pt-10 text-center text-sm text-muted-foreground">
          Не пришёл код?{" "}
          <Button variant="link" className="h-auto p-0 text-sm" onClick={onOpenBot}>
            Открыть бота ещё раз
          </Button>
        </p>
      )}
    </main>
  );
}
