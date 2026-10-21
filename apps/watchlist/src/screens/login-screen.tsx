import type { ReactNode } from "react";

import { Button, buttonVariants } from "@lists/ui/components/ui/button";
import { Input } from "@lists/ui/components/ui/input";
import { cn } from "@lists/ui/lib/utils";
import { LoaderCircleIcon, SendIcon, WifiOffIcon } from "lucide-react";

import { UpdateButton } from "./update-button.tsx";

/** Бот входа: имя и ссылка, пока сервер его не назвал или недоступен. */
export type LoginBot = { name: string; link: string } | "loading" | "unavailable";

/**
 * Экран входа (вариант A прототипа вехи 6, упрощён под свободный код): оба шага видны сразу –
 * «получите код у бота» и «введите код». Код можно получить и на другом устройстве, поэтому поле
 * кода доступно всегда. Новую версию экран предлагает, как и список: исправление входа должно
 * дойти и до того, кто не может войти. Экран показывает готовые строки, правил входа не знает.
 */
export function LoginScreen({
  bot,
  code,
  codeLength,
  checking,
  problem,
  onCodeChange,
  onCodePaste,
  onSubmit,
  onUpdate,
}: {
  bot: LoginBot;
  /** Только цифры. */
  code: string;
  codeLength: number;
  /** Код отправлен на проверку, ответа ещё нет. */
  checking: boolean;
  /** Почему не впустили – готовый текст. */
  problem?: string;
  /** Значение поля после набора: родитель сам оставит цифры. */
  onCodeChange: (value: string) => void;
  /** Вставленный текст. `true` – родитель взял из него код, и поле текст не вставляет. */
  onCodePaste: (text: string) => boolean;
  onSubmit: () => void;
  /** Есть, когда готова новая версия. */
  onUpdate?: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 pt-[calc(max(1rem,env(safe-area-inset-top))+1rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <img
          src="/icon-192.png"
          alt=""
          className="mb-3 size-12 rounded-[22%] shadow-sm ring-1 ring-foreground/10"
        />
        <h1 className="font-heading text-2xl font-medium">Вотчлист</h1>
        <p className="mt-1 text-muted-foreground">Вход через Telegram, без пароля.</p>
      </header>

      <ol className="grid gap-3">
        <Step
          number={1}
          title="Получите код у бота"
          description={
            typeof bot === "object"
              ? `Откроется Telegram, бот ${bot.name} пришлёт код. Можно открыть его и на другом устройстве.`
              : "Откроется Telegram, бот пришлёт код. Можно открыть его и на другом устройстве."
          }
        >
          {typeof bot === "object" ? (
            <a href={bot.link} className={cn(buttonVariants(), "h-12 w-full text-base")}>
              <SendIcon />
              Открыть бота в Telegram
            </a>
          ) : (
            <Button disabled className="h-12 w-full text-base">
              <SendIcon />
              Открыть бота в Telegram
            </Button>
          )}
          {bot === "unavailable" && (
            <p className="mt-3 flex gap-2 text-sm text-pretty">
              <WifiOffIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              Нет связи с сервером: ссылка на бота появится, когда связь вернётся.
            </p>
          )}
        </Step>

        <Step number={2} title="Введите код" description={`${codeLength} цифр из сообщения бота.`}>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <Input
              aria-label="Код из Telegram"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder={"•".repeat(codeLength)}
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              onPaste={(event) => {
                if (checking) return;
                if (onCodePaste(event.clipboardData.getData("text"))) event.preventDefault();
              }}
              readOnly={checking}
              aria-invalid={problem ? true : undefined}
              className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.3em] tabular-nums md:text-2xl"
            />
            {problem && (
              <p role="alert" className="mt-3 text-sm text-pretty text-destructive">
                {problem}
              </p>
            )}
            <Button
              type="submit"
              disabled={checking || code.length !== codeLength}
              className="mt-4 h-12 w-full text-base"
            >
              {checking && <LoaderCircleIcon className="animate-spin" />}
              {checking ? "Проверяем код" : "Войти"}
            </Button>
          </form>
        </Step>
      </ol>

      {onUpdate && (
        <div className="mt-auto flex pt-6">
          <UpdateButton onUpdate={onUpdate} />
        </div>
      )}
    </main>
  );
}

/** Шаг в карточке: номер, заголовок, пояснение и действия шага. */
function Step({
  number,
  title,
  description,
  children,
}: {
  number: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <li className="rounded-2xl border bg-card p-4 text-card-foreground">
      <div className="flex gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {number}
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
