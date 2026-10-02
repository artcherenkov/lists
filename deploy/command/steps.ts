import type { Cancellation } from "./cancellation.ts";

import { REMOTE_ROOT, SSH_HOST } from "./config.ts";

/** Выполняет скрипт на сервере и отдаёт его стандартный вывод. */
export type ExecuteOnServer = (
  script: string,
  input: Uint8Array | undefined,
  kill: AbortSignal,
) => Promise<string>;

export interface StepOptions {
  input?: Uint8Array;
  /**
   * `false` – шаг, который нельзя оставлять недоделанным после переключения: мягкая остановка не
   * мешает ему начаться.
   */
  interruptible?: boolean;
}

/** Команда, которая показывает указатели и конец журнала включений. */
export function inspectStateCommand(): string {
  return `ssh ${SSH_HOST} 'readlink ${REMOTE_ROOT}/current ${REMOTE_ROOT}/previous; tail -3 ${REMOTE_ROOT}/releases.log'`;
}

/** Шаг на сервере не завершился: его прервали жёстко, и команда на сервере могла ещё идти. */
export class StepInterruptedError extends Error {
  constructor(step: string, options?: ErrorOptions) {
    super(
      `Прервано на шаге «${step}»: команда на сервере могла не закончиться, а блокировка снята. ` +
        `Проверь состояние: ${inspectStateCommand()}`,
      options,
    );
    this.name = "StepInterruptedError";
  }
}

/**
 * Запускает шаги на сервере по одному. Перед шагом проверяет мягкую остановку: шаг, который уже
 * идёт, она не трогает, а следующий не начинается.
 */
export function createStepRunner(cancel: Cancellation, execute: ExecuteOnServer) {
  return async function runStep(
    step: string,
    script: string,
    options: StepOptions = {},
  ): Promise<string> {
    if (options.interruptible !== false) cancel.stop.throwIfAborted();
    try {
      return await execute(script, options.input, cancel.kill);
    } catch (error) {
      if (cancel.kill.aborted) throw new StepInterruptedError(step, { cause: error });
      throw new Error(`Шаг «${step}» на сервере не выполнен`, { cause: error });
    }
  };
}
