import type { Remote } from "../remote.ts";

import { describe, expect, it, vi } from "vitest";

import { deployUnderLock, type DeployDeps } from "../deploy.ts";

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
  const run = (deps: Partial<DeployDeps> = {}) =>
    deployUnderLock(
      { commit: B, cancel, lock, operation, remote: remote as unknown as Remote, deliver },
      { switchAndVerify, ...deps },
    );
  return {
    events,
    remote,
    deliver,
    switchAndVerify,
    cancel,
    lock,
    operation,
    state,
    run,
  };
}

describe("выкладка под блокировкой", () => {
  it("нового релиза: сборка и доставка, затем включение с проверкой", async () => {
    const { events, deliver, remote, operation, run } = setup();

    await run();

    expect(events).toEqual(["build", "deliver", "switch"]);
    expect(remote.releaseExists).toHaveBeenCalledWith(B);
    expect(deliver.mock.calls[0]![0]).toBe(operation.stop);
    expect(remote.deliver).toHaveBeenCalledWith(B, "/tmp/release");
  });

  it("релиз уже лежит на сервере: сборки нет, включение есть", async () => {
    const { events, run } = setup({ onServer: true });

    await run();

    expect(events).toEqual(["switch"]);
  });

  it("план и прежние указатели идут во включение: релиз уже текущий – указатели не меняются", async () => {
    const { events, switchAndVerify, cancel, lock, remote, state, run } = setup({
      current: B,
      onServer: true,
    });

    await run();

    const input = switchAndVerify.mock.calls[0]![0];
    expect(input).toMatchObject({ commit: B, stateBefore: state, cancel, lock, remote });
    expect(input.plan.switchPointers).toBe(false);
    expect(events).toEqual(["switch"]);
  });

  it("включение получает блокировку и остановку как есть: потеря блокировки добавляется внутри, а не здесь", async () => {
    const { switchAndVerify, cancel, lock, run } = setup();

    await run();

    const input = switchAndVerify.mock.calls[0]![0];
    expect(input.lock).toBe(lock);
    expect(input.cancel).toBe(cancel);
  });
});
