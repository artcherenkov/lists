import type { Cancellation } from "./cancellation.ts";
import type { DeployLock, Remote } from "./remote.ts";

import { fileURLToPath } from "node:url";

import { withBuiltRelease } from "./build.ts";
import { SITE_URL } from "./config.ts";
import { assertReleaseFilesInCommit, resolveCommit, workingTreeStatus } from "./git.ts";
import { detail, step, warn } from "./log.ts";
import { planDeploy } from "./pointers.ts";
import { switchAndVerify } from "./switch-and-verify.ts";
import { withServerLock } from "./with-lock.ts";
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

  await withServerLock(`${commit} ${new Date().toISOString()}`, cancel, (context) =>
    deployUnderLock({
      commit,
      cancel,
      ...context,
      deliver: (signal, upload) =>
        withBuiltRelease({ repoRoot: REPO_ROOT, commit, signal }, upload),
    }),
  );
}

/** Зависимости, которые подменяют в тестах. */
export interface DeployDeps {
  switchAndVerify: typeof switchAndVerify;
}

const realDeps: DeployDeps = { switchAndVerify };

export interface DeployUnderLockInput {
  commit: string;
  cancel: Cancellation;
  lock: Pick<DeployLock, "lost">;
  /** Остановка с потерей блокировки: ею прерывается сборка. */
  operation: Cancellation;
  remote: Remote;
  /** Собирает релиз коммита и отдаёт каталог в `upload`; `signal` прерывает сборку. */
  deliver: (signal: AbortSignal, upload: (releaseDir: string) => Promise<void>) => Promise<void>;
}

/**
 * Порядок выкладки после взятия блокировки: указатели, доставка (если релиза нет на сервере),
 * включение с проверкой и возвратом при неудаче.
 */
export async function deployUnderLock(
  input: DeployUnderLockInput,
  deps: DeployDeps = realDeps,
): Promise<void> {
  const { commit, remote } = input;
  const stateBefore = await remote.readPointers();
  const plan = planDeploy({
    state: stateBefore,
    release: commit,
    releaseOnServer: await remote.releaseExists(commit),
  });

  if (plan.deliver) {
    step("Собираю релиз и доставляю на сервер");
    await input.deliver(input.operation.stop, (releaseDir) => remote.deliver(commit, releaseDir));
  } else {
    step(
      plan.switchPointers
        ? "Релиз уже лежит на сервере: включаю без сборки"
        : "Релиз уже текущий: только проверка",
    );
  }

  const { filesChecked } = await deps.switchAndVerify({
    commit,
    plan,
    stateBefore,
    remote,
    cancel: input.cancel,
    lock: input.lock,
  });
  detail(`Файлов проверено: ${filesChecked}, заголовки, sw.js и /api/ в порядке`);
  step(`Готово: ${SITE_URL} отдаёт ${commit.slice(0, 7)}`);
}
