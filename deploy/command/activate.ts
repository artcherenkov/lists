import type { Remote } from "./remote.ts";
import type { VerifyResult } from "./verify-site.ts";

import { formatError } from "./errors.ts";
import { step } from "./log.ts";
import { planReturn, type DeployPlan, type PointerState } from "./pointers.ts";
import { inspectStateCommand } from "./steps.ts";

/** Шаги переключения на сервере: те, что нужны и вперёд, и при возврате. */
export type SwitchRemote = Pick<Remote, "switchPointers" | "composeUp" | "caddyReload">;

export interface ActivationInput {
  commit: string;
  plan: DeployPlan;
  stateBefore: PointerState;
  /**
   * Шаги вперёд. Остановка (`stop`) не даёт начаться первому шагу, а `compose up` и `reload`
   * доводятся до конца: релиз не должен остаться наполовину.
   */
  forward: SwitchRemote;
  /**
   * Шаги возврата. Мягкая остановка возврат не прерывает: его бросать на полпути хуже, чем
   * довести. Прерывает его только потеря блокировки (рядом может идти другая выкладка) и жёсткая
   * остановка, поэтому остановка этого `Remote` – только `lock.lost`.
   */
  back: SwitchRemote;
  /** Любая остановка: мягкая, потеря блокировки. */
  stop: AbortSignal;
  /** Жёсткая остановка: после неё возврат не начинают, шаг на сервере уже прерван. */
  kill: AbortSignal;
  /** Проверка сайта по HTTPS. */
  verify: () => Promise<VerifyResult>;
}

/**
 * Включение релиза и проверка. Все исходы:
 * - шаг после начала переключения упал, или сайт ответил неверно – возврат на прежний релиз;
 * - сайт не ответил до предельного срока – релиз остаётся включённым, ошибка советует повторить;
 * - остановка во время проверки – не неудача: релиз остаётся включённым, возврата нет;
 * - релиз уже текущий (`plan.switchPointers` ложен) – только проверка, возврата нет в любом исходе.
 * Остановка, пришедшая до начала переключения, ничего не меняет на сервере: она не заворачивается
 * в ошибку возврата.
 */
export async function activateRelease(input: ActivationInput): Promise<VerifyResult> {
  const { plan, stop, kill } = input;
  if (plan.switchPointers) {
    stop.throwIfAborted();
    try {
      step("Записываю включение в журнал и переключаю указатели");
      await input.forward.switchPointers(plan.next, plan.recordActivation);
      step("Запускаю сервисы релиза (compose up)");
      await input.forward.composeUp();
      step("Применяю конфигурацию Caddy (reload)");
      await input.forward.caddyReload();
    } catch (error) {
      // Жёстко прерванный шаг уже говорит, что состояние на сервере неизвестно.
      if (kill.aborted) throw error;
      throw await returnToPrevious(input, error);
    }
  }

  let result: VerifyResult;
  try {
    result = await input.verify();
  } catch (error) {
    if (stop.aborted) throw new CheckStoppedError(input.commit, plan.switchPointers, error);
    throw error;
  }

  const { assessment } = result;
  if (assessment.kind === "ok") return result;
  if (assessment.kind === "unverified") {
    throw new SiteUnverifiedError(
      input.commit,
      plan.switchPointers,
      result.attempts,
      assessment.reason,
    );
  }
  const failure = new SiteCheckFailedError(assessment.reasons);
  if (!plan.switchPointers) throw failure;
  throw await returnToPrevious(input, failure);
}

/**
 * Возвращает сайт в состояние до выкладки и отдаёт ошибку, которую нужно бросить. Указатели
 * ставятся ровно как были (`planReturn`), потом `compose up` и `reload` прежнего релиза: они берут
 * `current`, который уже указывает на него.
 */
async function returnToPrevious(input: ActivationInput, cause: unknown): Promise<Error> {
  const returning = planReturn(input.stateBefore);
  if (returning === null) return new FirstDeployFailedError(cause);

  step(`Возвращаю сайт на прежний релиз ${shortHash(returning.target.current)}`);
  try {
    await input.back.switchPointers(returning.target, returning.recordActivation);
    step("Запускаю сервисы прежнего релиза (compose up)");
    await input.back.composeUp({ interruptible: true });
    step("Применяю конфигурацию Caddy прежнего релиза (reload)");
    await input.back.caddyReload({ interruptible: true });
  } catch (returnError) {
    return new ReturnFailedError(input.stateBefore, cause, returnError);
  }
  return new ReturnedError(input.stateBefore, cause);
}

function shortHash(hash: string | null): string {
  return hash === null ? "нет" : hash.slice(0, 7);
}

function describePointers(state: PointerState): string {
  return `current=${state.current ?? "нет"}, previous=${state.previous ?? "нет"}`;
}

/** Сайт ответил неверно. */
export class SiteCheckFailedError extends Error {
  constructor(reasons: string[]) {
    super(`Проверка не пройдена:\n${reasons.map((r) => `  – ${r}`).join("\n")}`);
    this.name = "SiteCheckFailedError";
  }
}

/** Возврат прошёл: сайт снова на прежнем релизе. */
export class ReturnedError extends Error {
  constructor(stateBefore: PointerState, cause: unknown) {
    super(
      `Выкладка не удалась, сайт возвращён на прежний релиз ${shortHash(stateBefore.current)}: ` +
        `указатели как до выкладки (${describePointers(stateBefore)}), сервисы и конфигурация Caddy применены для него`,
      { cause },
    );
    this.name = "ReturnedError";
  }
}

/** Первая выкладка: до неё релиза не было, возвращаться некуда. */
export class FirstDeployFailedError extends Error {
  constructor(cause: unknown) {
    super(
      "Выкладка не удалась. Это первая выкладка: прежнего релиза нет, возвращаться некуда, " +
        `новый релиз мог остаться включённым и сайт мог остаться неисправным. Состояние: ${inspectStateCommand()}`,
      { cause },
    );
    this.name = "FirstDeployFailedError";
  }
}

/** Сам возврат не завершился: шаг упал, его прервали или блокировка потеряна. */
export class ReturnFailedError extends Error {
  constructor(stateBefore: PointerState, original: unknown, returnError: unknown) {
    super(
      "Выкладка не удалась, и возврат на прежний релиз не завершён: на сервере может остаться промежуточное состояние. " +
        `До выкладки было ${describePointers(stateBefore)}. Проверь состояние и при необходимости верни его вручную: ${inspectStateCommand()}\n` +
        `Исходная причина: ${formatError(original)}`,
      { cause: returnError },
    );
    this.name = "ReturnFailedError";
  }
}

/** Сайт не ответил до предельного срока: о релизе ничего не известно, его не трогали. */
export class SiteUnverifiedError extends Error {
  constructor(commit: string, switched: boolean, attempts: number, reason: string) {
    super(
      `Не удалось проверить сайт: ответа не было за ${attempts} проходов (${reason}). ` +
        (switched
          ? `Релиз ${shortHash(commit)} включён и не откатывался: возможно, сайт исправен, а недоступна сеть. `
          : `Релиз ${shortHash(commit)} уже был текущим и не менялся. `) +
        `Повтори \`pnpm deploy:v2 ${commit}\`: релиз уже текущий, команда только проверит сайт.`,
    );
    this.name = "SiteUnverifiedError";
  }
}

/** Остановка во время проверки – не неудача релиза: возврата нет. */
export class CheckStoppedError extends Error {
  constructor(commit: string, switched: boolean, cause: unknown) {
    super(
      `Проверка остановлена, сайт не проверен. ` +
        (switched
          ? `Релиз ${shortHash(commit)} уже включён и остаётся включённым: возврата нет. `
          : `Релиз ${shortHash(commit)} уже был текущим и не менялся. `) +
        `Повтори \`pnpm deploy:v2 ${commit}\`: команда только проверит сайт.`,
      { cause },
    );
    this.name = "CheckStoppedError";
  }
}
