import { stopWhenLockLost, type Cancellation } from "./cancellation.ts";
import { acquireLock, createRemote, type DeployLock, type Remote } from "./remote.ts";

/** Зависимости, которые подменяют в тестах. */
export interface LockDeps {
  acquireLock: typeof acquireLock;
  createRemote: typeof createRemote;
}

const realDeps: LockDeps = { acquireLock, createRemote };

/**
 * Работа под блокировкой на сервере: потеря блокировки останавливает операцию, как первый Ctrl+C.
 * Блокировка отпускается при любом исходе.
 */
export async function withServerLock<T>(
  owner: string,
  cancel: Cancellation,
  work: (context: { lock: DeployLock; operation: Cancellation; remote: Remote }) => Promise<T>,
  deps: LockDeps = realDeps,
): Promise<T> {
  const lock = await deps.acquireLock(owner, cancel.stop);
  try {
    const operation = stopWhenLockLost(cancel, lock.lost);
    return await work({ lock, operation, remote: deps.createRemote(operation) });
  } finally {
    await lock.release();
  }
}
