import type { Remote } from "../remote.ts";

import { describe, expect, it, vi } from "vitest";

import { CleanupFailedError, deployUnderLock, type DeployDeps } from "../deploy.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const OK = { assessment: { kind: "ok" as const }, filesChecked: 4, attempts: 1 };

/** Порядок выкладки на подменённом сервере: журнал `events` хранит порядок и аргументы вызовов. */
function setup(options: { current?: string | null; onServer?: boolean } = {}) {
  const events: string[] = [];
  const stop = new AbortController();
  const operation = { stop: stop.signal, kill: new AbortController().signal };
  const cancel = { stop: new AbortController().signal, kill: operation.kill };
  const lock = { lost: new AbortController().signal };
  const state = { current: options.current === undefined ? A : options.current, previous: null };

  const remote = {
    readPointers: vi.fn<() => Promise<typeof state>>(async () => state),
    releaseExists: vi.fn<(commit: string) => Promise<boolean>>(
      async () => options.onServer ?? false,
    ),
    deliver: vi.fn<(commit: string, dir: string) => Promise<void>>(async () => {
      events.push("deliver");
    }),
  };
  const deliver = vi.fn<
    (signal: AbortSignal, upload: (dir: string) => Promise<void>) => Promise<void>
  >(async (_signal, upload) => {
    events.push("build");
    await upload("/tmp/release");
  });
  const switchAndVerify = vi.fn<DeployDeps["switchAndVerify"]>(async () => {
    events.push("switch");
    return OK;
  });
  const cleanOldReleases = vi.fn<DeployDeps["cleanOldReleases"]>(async () => {
    events.push("cleanup");
  });
  const run = (deps: Partial<DeployDeps> = {}) =>
    deployUnderLock(
      { commit: B, cancel, lock, operation, remote: remote as unknown as Remote, deliver },
      { switchAndVerify, cleanOldReleases, ...deps },
    );
  return {
    events,
    remote,
    deliver,
    switchAndVerify,
    cleanOldReleases,
    cancel,
    lock,
    operation,
    state,
    run,
  };
}

describe("выкладка под блокировкой", () => {
  it("нового релиза: сборка и доставка, включение с проверкой, очистка – в этом порядке", async () => {
    const { events, deliver, remote, operation, run } = setup();

    await run();

    expect(events).toEqual(["build", "deliver", "switch", "cleanup"]);
    expect(remote.releaseExists).toHaveBeenCalledWith(B);
    expect(deliver.mock.calls[0]![0]).toBe(operation.stop);
    expect(remote.deliver).toHaveBeenCalledWith(B, "/tmp/release");
  });

  it("релиз уже лежит на сервере: сборки нет, включение и очистка есть", async () => {
    const { events, run } = setup({ onServer: true });

    await run();

    expect(events).toEqual(["switch", "cleanup"]);
  });

  it("план и прежние указатели идут во включение: релиз уже текущий – указатели не меняются, очистка всё равно идёт", async () => {
    const { events, switchAndVerify, cancel, lock, remote, state, run } = setup({
      current: B,
      onServer: true,
    });

    await run();

    const input = switchAndVerify.mock.calls[0]![0];
    expect(input).toMatchObject({ commit: B, stateBefore: state, cancel, lock, remote });
    expect(input.plan.switchPointers).toBe(false);
    expect(events).toEqual(["switch", "cleanup"]);
  });

  it("включение получает блокировку и остановку как есть: потеря блокировки добавляется внутри, а не здесь", async () => {
    const { switchAndVerify, cancel, lock, run } = setup();

    await run();

    const input = switchAndVerify.mock.calls[0]![0];
    expect(input.lock).toBe(lock);
    expect(input.cancel).toBe(cancel);
  });

  it("очистка получает тот же сервер", async () => {
    const { cleanOldReleases, remote, run } = setup();

    await run();

    expect(cleanOldReleases).toHaveBeenCalledWith(remote);
  });

  it("возврат или «не удалось проверить»: switchAndVerify бросил ошибку – очистки нет", async () => {
    const { events, cleanOldReleases, run } = setup();

    await expect(
      run({
        switchAndVerify: async () => {
          throw new Error("возвращено");
        },
      }),
    ).rejects.toThrow("возвращено");

    expect(cleanOldReleases).not.toHaveBeenCalled();
    expect(events).not.toContain("cleanup");
  });

  it("очистка упала: релиз выложен и проверен, очистка повторится, исходная причина в цепочке", async () => {
    const { run } = setup();

    const error = await run({
      cleanOldReleases: async () => {
        throw new Error("ssh оборвался");
      },
    }).catch((e) => e);

    expect(error).toBeInstanceOf(CleanupFailedError);
    expect(error.message).toContain("выложен и проверен");
    expect(error.message).toContain("повторится при следующей выкладке");
    expect(error.cause.message).toBe("ssh оборвался");
  });
});
