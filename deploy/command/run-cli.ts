import { StoppedError, createEscalation, type Cancellation } from "./cancellation.ts";
import { warn } from "./log.ts";
import { LockBusyError } from "./remote.ts";

/**
 * Запускает команду и связывает с ней прерывание (Ctrl+C, SIGTERM): первое просит остановиться
 * между шагами и даёт текущему шагу на сервере закончиться, второе прерывает и шаг на сервере,
 * третье выходит сразу. Блокировку и временный worktree освобождают `finally` самой команды.
 * Ошибка и причины печатаются, код выхода – 1, после прерывания – 130.
 */
export async function runCli(command: (cancel: Cancellation) => Promise<void>): Promise<void> {
  const stop = new AbortController();
  const kill = new AbortController();
  const interrupt = createEscalation({
    onStop: () => {
      warn(
        "Получен сигнал прерывания: дождусь конца текущего шага на сервере и остановлюсь. Повторный Ctrl+C прервёт шаг на сервере сразу.",
      );
      stop.abort(new StoppedError());
    },
    onKill: () => {
      warn("Прерываю шаг на сервере: он мог не закончиться. Третий Ctrl+C выйдет немедленно.");
      kill.abort();
    },
    onExit: () => process.exit(130),
  });
  for (const signalName of ["SIGINT", "SIGTERM"] as const) process.on(signalName, interrupt);

  try {
    await command({ stop: stop.signal, kill: kill.signal });
  } catch (error) {
    console.error(error instanceof LockBusyError ? error.message : `Ошибка: ${formatError(error)}`);
    process.exitCode = stop.signal.aborted ? 130 : 1;
  }
}

function formatError(error: unknown): string {
  const lines: string[] = [];
  for (let current = error; current !== undefined;) {
    const message = current instanceof Error ? current.message : String(current);
    lines.push(message);
    current = current instanceof Error ? current.cause : undefined;
  }
  return lines.join("\n  причина: ");
}
