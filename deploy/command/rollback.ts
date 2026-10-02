import type { Cancellation } from "./cancellation.ts";

import { SITE_URL } from "./config.ts";
import { detail, step } from "./log.ts";
import { planRollback } from "./pointers.ts";
import { acquireLock, createRemote } from "./remote.ts";
import { switchAndVerify } from "./switch-and-verify.ts";
import { withServerLock, type LockDeps } from "./with-lock.ts";

export interface RollbackDeps extends LockDeps {
  switchAndVerify: typeof switchAndVerify;
}

const realDeps: RollbackDeps = { acquireLock, createRemote, switchAndVerify };

/**
 * Откатывает сайт на релиз, который был текущим до последнего переключения: `pnpm rollback:v2`.
 * Включение, проверка по `SHA256SUMS` откатываемого релиза и возврат при неудаче – те же, что у
 * выкладки. Очистки нет: откат ничего не удаляет.
 */
export async function rollback(cancel: Cancellation, deps: RollbackDeps = realDeps): Promise<void> {
  step("Откатываю сайт на прежний релиз");
  await withServerLock(
    `rollback ${new Date().toISOString()}`,
    cancel,
    async ({ lock, remote }) => {
      const stateBefore = await remote.readPointers();
      const { release, plan } = planRollback({
        state: stateBefore,
        previousOnServer:
          stateBefore.previous !== null && (await remote.releaseExists(stateBefore.previous)),
      });

      step(`Включаю релиз ${release}`);
      const { filesChecked } = await deps.switchAndVerify({
        commit: release,
        plan,
        stateBefore,
        remote,
        cancel,
        lock,
      });
      detail(`Файлов проверено: ${filesChecked}, заголовки, sw.js и /api/ в порядке`);
      step(`Готово: ${SITE_URL} отдаёт ${release.slice(0, 7)}`);
    },
    deps,
  );
}
