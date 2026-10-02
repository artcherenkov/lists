import { fileURLToPath } from "node:url";

import { withBuiltRelease } from "./build.ts";
import { stopWhenLockLost, type Cancellation } from "./cancellation.ts";
import { parseChecksums } from "./checksums.ts";
import { SITE_URL } from "./config.ts";
import { assertReleaseFilesInCommit, resolveCommit, workingTreeStatus } from "./git.ts";
import { detail, step, warn } from "./log.ts";
import { planDeploy, type DeployPlan, type PointerState } from "./pointers.ts";
import { acquireLock, createRemote, type Remote } from "./remote.ts";
import { verifySite } from "./verify-site.ts";
import { workingTreeWarning } from "./working-tree.ts";

const REPO_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Выкладывает сборку коммита на `cora`: `pnpm deploy:v2 [коммит]`, по умолчанию `HEAD`.
 * Порядок и причины – в `deploy/README.md` и в документе вехи 3.
 */
export async function deploy(revision: string, cancel: Cancellation): Promise<void> {
  const commit = await resolveCommit(REPO_ROOT, revision);
  await assertReleaseFilesInCommit(REPO_ROOT, commit);
  const treeWarning = workingTreeWarning(await workingTreeStatus(REPO_ROOT));
  if (treeWarning !== null) warn(treeWarning);
  step(`Выкладываю коммит ${commit}`);

  const lock = await acquireLock(`${commit} ${new Date().toISOString()}`, cancel.stop);
  try {
    const operation = stopWhenLockLost(cancel, lock.lost);
    const remote = createRemote(operation);
    const stateBefore = await remote.readPointers();
    const plan = planDeploy({
      state: stateBefore,
      release: commit,
      releaseOnServer: await remote.releaseExists(commit),
    });

    if (plan.deliver) {
      step("Собираю релиз и доставляю на сервер");
      await withBuiltRelease(
        { repoRoot: REPO_ROOT, commit, signal: operation.stop },
        (releaseDir) => remote.deliver(commit, releaseDir),
      );
    } else {
      step(
        plan.switchPointers
          ? "Релиз уже лежит на сервере: включаю без сборки"
          : "Релиз уже текущий: только проверка",
      );
    }

    if (plan.switchPointers) {
      step("Проверяю Caddyfile нового релиза");
      await remote.validateCaddyfile(commit);
      await switchToRelease(remote, plan, stateBefore, operation.stop);
    }

    await verify(remote, commit, operation.stop, plan.switchPointers, stateBefore);
  } finally {
    await lock.release();
  }
}

/**
 * Переключение и запуск нового релиза. Ошибка после начала переключения – `AfterSwitchError`:
 * возврата в этом срезе нет. Остановка, пришедшая раньше, ничего не меняет на сервере, поэтому
 * проверяется до `try` и в `AfterSwitchError` не заворачивается.
 */
export async function switchToRelease(
  remote: Remote,
  plan: DeployPlan,
  stateBefore: PointerState,
  stop: AbortSignal,
): Promise<void> {
  stop.throwIfAborted();
  try {
    step("Записываю включение в журнал и переключаю указатели");
    await remote.switchPointers(plan.next, plan.recordActivation);
    step("Запускаю сервисы релиза (compose up)");
    await remote.composeUp();
    step("Применяю конфигурацию Caddy (reload)");
    await remote.caddyReload();
  } catch (error) {
    throw new AfterSwitchError(stateBefore, error);
  }
}

async function verify(
  remote: Remote,
  commit: string,
  stop: AbortSignal,
  switched: boolean,
  stateBefore: PointerState,
): Promise<void> {
  try {
    step(`Проверяю ${SITE_URL} по HTTPS`);
    const entries = parseChecksums(await remote.readChecksums(commit));
    const { verdict, filesChecked } = await verifySite(SITE_URL, entries, stop);
    if (!verdict.ok) {
      throw new Error(
        `Проверка не пройдена:\n${verdict.reasons.map((r) => `  – ${r}`).join("\n")}`,
      );
    }
    detail(`Файлов проверено: ${filesChecked}, заголовки, sw.js и /api/ в порядке`);
  } catch (error) {
    if (switched) throw new AfterSwitchError(stateBefore, error);
    throw error;
  }
  step(`Готово: ${SITE_URL} отдаёт ${commit.slice(0, 7)}`);
}

/**
 * Ошибка после переключения. Автоматического возврата пока нет, поэтому сообщение называет прежнее
 * состояние указателей: по нему сайт возвращают вручную.
 */
class AfterSwitchError extends Error {
  constructor(stateBefore: PointerState, cause: unknown) {
    super(
      `Ошибка после переключения, автоматического возврата нет. До выкладки: current=${stateBefore.current ?? "нет"}, previous=${stateBefore.previous ?? "нет"}.`,
      { cause },
    );
    this.name = "AfterSwitchError";
  }
}
