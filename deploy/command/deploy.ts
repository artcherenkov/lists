import { fileURLToPath } from "node:url";

import { withBuiltRelease } from "./build.ts";
import { stopWhenLockLost, type Cancellation } from "./cancellation.ts";
import { SITE_URL } from "./config.ts";
import { assertReleaseFilesInCommit, resolveCommit, workingTreeStatus } from "./git.ts";
import { detail, step, warn } from "./log.ts";
import { planDeploy } from "./pointers.ts";
import { acquireLock, createRemote } from "./remote.ts";
import { switchAndVerify } from "./switch-and-verify.ts";
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

    const { filesChecked } = await switchAndVerify({
      commit,
      plan,
      stateBefore,
      remote,
      cancel,
      lock,
    });
    detail(`Файлов проверено: ${filesChecked}, заголовки, sw.js и /api/ в порядке`);
    step(`Готово: ${SITE_URL} отдаёт ${commit.slice(0, 7)}`);
  } finally {
    await lock.release();
  }
}
