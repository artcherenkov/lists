import { activateRelease, type SwitchRemote } from "./activate.ts";
import { returnCancellation, stopWhenLockLost, type Cancellation } from "./cancellation.ts";
import { parseChecksums } from "./checksums.ts";
import { SITE_URL, VERIFY_RETRY_DELAY_MS } from "./config.ts";
import { step, warn } from "./log.ts";
import { type DeployPlan, type PointerState } from "./pointers.ts";
import { createRemote, type DeployLock, type Remote } from "./remote.ts";
import { verificationDeadlineMs } from "./verification.ts";
import { verifySite } from "./verify-site.ts";

/** Зависимости, которые подменяют в тестах: что именно собрала проводка. */
export interface SwitchAndVerifyDeps {
  createRemote: (cancel: Cancellation) => SwitchRemote;
  verifySite: typeof verifySite;
  activateRelease: typeof activateRelease;
}

const realDeps: SwitchAndVerifyDeps = { createRemote, verifySite, activateRelease };

export interface SwitchAndVerifyInput {
  commit: string;
  plan: DeployPlan;
  stateBefore: PointerState;
  /** Шаги вперёд. */
  remote: Pick<Remote, "readChecksums" | "validateCaddyfile"> & SwitchRemote;
  /** Остановка, как пришла от пользователя: потеря блокировки добавляется здесь. */
  cancel: Cancellation;
  lock: Pick<DeployLock, "lost">;
}

/**
 * Чтение сумм релиза (по ним проверяется сайт) и `caddy validate` до переключения (только если
 * указатели меняются), затем переключение, возврат при неудаче и проверка сайта. Здесь собраны
 * сигналы остановки каждой части: какая остановка какой шаг прерывает.
 */
export async function switchAndVerify(
  input: SwitchAndVerifyInput,
  deps: SwitchAndVerifyDeps = realDeps,
) {
  const { commit, plan, stateBefore } = input;
  const operation = stopWhenLockLost(input.cancel, input.lock.lost);
  const checksums = parseChecksums(await input.remote.readChecksums(commit));
  if (plan.switchPointers) {
    step("Проверяю Caddyfile нового релиза");
    await input.remote.validateCaddyfile(commit);
  }

  return deps.activateRelease({
    commit,
    plan,
    stateBefore,
    forward: input.remote,
    back: deps.createRemote(returnCancellation(operation, input.lock.lost)),
    stop: operation.stop,
    kill: operation.kill,
    verify: () => {
      step(`Проверяю ${SITE_URL} по HTTPS`);
      return deps.verifySite(SITE_URL, checksums, {
        deadlineMs: verificationDeadlineMs(stateBefore),
        retryDelayMs: VERIFY_RETRY_DELAY_MS,
        signal: operation.stop,
        onRetry: ({ attempt, reason, delayMs }) =>
          warn(`Проход ${attempt}: ${reason}. Повторю через ${Math.round(delayMs / 1000)} с`),
      });
    },
  });
}
