import { spawn } from "node:child_process";

export interface RunOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Стандартный ввод команды. */
  input?: string | Uint8Array;
  signal?: AbortSignal;
  /** Своя группа процессов: Ctrl+C в терминале команду не задевает. */
  detached?: boolean;
}

export class CommandError extends Error {
  readonly stdout: string;
  readonly stderr: string;
  constructor(description: string, stdout: string, stderr: string, options?: ErrorOptions) {
    const output = (stderr.trim() || stdout.trim()).split("\n").slice(-15).join("\n");
    super(output === "" ? description : `${description}\n${output}`, options);
    this.name = "CommandError";
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

/** Длинные аргументы (скрипты для `ssh`) в сообщение не попадают: нужны команда и хвост вывода. */
function commandLine(command: string, args: string[]): string {
  const line = [command, ...args].join(" ");
  return line.length <= 80 ? line : command;
}

/** Запускает команду без shell. Ненулевой код или прерывание – `CommandError` с хвостом вывода. */
export function run(
  command: string,
  args: string[],
  options: RunOptions = {},
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      signal: options.signal,
      detached: options.detached,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => (stderr += chunk));
    // Команда могла завершиться, не дочитав ввод: ошибка записи тогда не важна, важен код выхода.
    child.stdin.on("error", () => {});
    child.stdin.end(options.input);

    child.once("error", (error) => {
      // Остановку с заданной причиной (потеря блокировки, Ctrl+C) отдаём как есть: она главнее
      // сообщения «команда прервана».
      const reason: unknown = options.signal?.reason;
      if (error.name === "AbortError" && reason instanceof Error && reason.name !== "AbortError") {
        return reject(reason);
      }
      const description =
        error.name === "AbortError" ? `${command}: прервано` : `${command}: не удалось запустить`;
      reject(new CommandError(description, stdout, stderr, { cause: error }));
    });
    child.once("close", (code, signalName) => {
      if (code === 0) return resolve({ stdout, stderr });
      const exit = signalName === null ? `код ${code}` : `сигнал ${signalName}`;
      reject(
        new CommandError(
          `${commandLine(command, args)} завершилась с ошибкой (${exit})`,
          stdout,
          stderr,
        ),
      );
    });
  });
}
