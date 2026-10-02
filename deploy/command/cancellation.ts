/**
 * Остановка операции двумя сигналами.
 * `stop` – мягкая: команды на сервере доходят до конца, новый шаг не начинается, локальные
 * команды (`git`, `pnpm`, `tar`) и запросы проверки прерываются.
 * `kill` – жёсткая: прерывает и команду на сервере, которая идёт сейчас.
 */
export interface Cancellation {
  stop: AbortSignal;
  kill: AbortSignal;
}

/**
 * Потеря блокировки останавливает операцию так же, как первый Ctrl+C: `stop` срабатывает от любого
 * из двух сигналов, причина – того, что сработал первым. `kill` не меняется: потеря блокировки
 * не повод убивать идущий шаг.
 */
export function stopWhenLockLost(cancel: Cancellation, lockLost: AbortSignal): Cancellation {
  return { stop: AbortSignal.any([cancel.stop, lockLost]), kill: cancel.kill };
}

/**
 * Остановка шагов возврата: мягкая остановка возврат не прерывает, его бросать на полпути хуже,
 * чем довести. Прерывают его потеря блокировки (рядом может идти другая выкладка) и жёсткая
 * остановка.
 */
export function returnCancellation(cancel: Cancellation, lockLost: AbortSignal): Cancellation {
  return { stop: lockLost, kill: cancel.kill };
}

/**
 * Что делает каждое следующее прерывание (Ctrl+C или SIGTERM): первое просит остановиться между
 * шагами, второе прерывает шаг на сервере, третье выходит из процесса.
 */
export function createEscalation(actions: {
  onStop: () => void;
  onKill: () => void;
  onExit: () => void;
}): () => void {
  let interrupts = 0;
  return () => {
    interrupts += 1;
    if (interrupts === 1) actions.onStop();
    else if (interrupts === 2) actions.onKill();
    else actions.onExit();
  };
}

export class StoppedError extends Error {
  constructor() {
    super("Операция остановлена по сигналу прерывания");
    this.name = "StoppedError";
  }
}
