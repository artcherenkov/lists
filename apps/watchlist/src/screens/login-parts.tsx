import type { LoginProblem } from "./login-view.ts";

import { cn } from "@lists/ui/lib/utils";
import { CircleAlertIcon, HourglassIcon, TimerOffIcon, WifiOffIcon } from "lucide-react";

/**
 * Значок приложения из сборки: тот же, что на экране «Домой». Скругление – долей размера,
 * как у значков iOS: токены радиуса на маленьком значке дают круг.
 */
export function AppIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icon-192.png"
      alt=""
      className={cn("shrink-0 rounded-[22%] shadow-sm ring-1 ring-foreground/10", className)}
    />
  );
}

const PROBLEM_ICONS = {
  retype: CircleAlertIcon,
  "new-link": TimerOffIcon,
  retry: WifiOffIcon,
  wait: HourglassIcon,
} as const;

/** Текст ошибки входа со значком: что случилось и что делать – в одной строке. */
export function LoginProblemText({
  problem,
  className,
}: {
  problem: LoginProblem;
  className?: string;
}) {
  const Icon = PROBLEM_ICONS[problem.fix];
  // Красным – то, что сломал код; сеть и ожидание от человека не зависят.
  const codeFailed = problem.fix === "retype" || problem.fix === "new-link";
  return (
    <p
      role="alert"
      className={cn(
        "flex gap-2 text-sm text-pretty",
        codeFailed ? "text-destructive" : "text-foreground",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          codeFailed ? "text-destructive" : "text-muted-foreground",
        )}
      />
      {problem.text}
    </p>
  );
}
