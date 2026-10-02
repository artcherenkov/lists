import type { Remote } from "../remote.ts";

import { describe, expect, it, vi } from "vitest";

import { rollback, type RollbackDeps } from "../rollback.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const OK = { assessment: { kind: "ok" as const }, filesChecked: 4, attempts: 1 };

function setup(
  options: {
    state?: { current: string | null; previous: string | null };
    previousOnServer?: boolean;
  } = {},
) {
  const state = options.state ?? { current: A, previous: B };
  const release = vi.fn<() => Promise<void>>(async () => {});
  const lost = new AbortController();
  const lock = { lost: lost.signal, release };
  const remote = {
    readPointers: vi.fn<() => Promise<typeof state>>(async () => state),
    releaseExists: vi.fn<(commit: string) => Promise<boolean>>(
      async () => options.previousOnServer ?? true,
    ),
  };
  const acquireLock = vi.fn<RollbackDeps["acquireLock"]>(async () => lock);
  const createRemote = vi.fn<RollbackDeps["createRemote"]>(() => remote as unknown as Remote);
  const switchAndVerify = vi.fn<RollbackDeps["switchAndVerify"]>(async () => OK);
  const cancel = { stop: new AbortController().signal, kill: new AbortController().signal };
  const run = () => rollback(cancel, { acquireLock, createRemote, switchAndVerify });
  return { state, release, lock, remote, acquireLock, switchAndVerify, cancel, run };
}

describe("откат", () => {
  it("включает previous с планом отката: прежние указатели, блокировка и остановка идут в проверку", async () => {
    const { state, lock, remote, switchAndVerify, cancel, run } = setup();

    await run();

    const input = switchAndVerify.mock.calls[0]![0];
    expect(input).toMatchObject({ commit: B, stateBefore: state, cancel, lock, remote });
    expect(input.plan).toMatchObject({
      deliver: false,
      switchPointers: true,
      recordActivation: true,
      next: { current: B, previous: A },
    });
  });

  it("наличие каталога previous проверяется у previous, а не у current", async () => {
    const { remote, run } = setup();

    await run();

    expect(remote.releaseExists).toHaveBeenCalledWith(B);
  });

  it("блокировка берётся с владельцем «rollback» и отпускается", async () => {
    const { acquireLock, release, run } = setup();

    await run();

    expect(acquireLock.mock.calls[0]![0]).toMatch(/^rollback /);
    expect(release).toHaveBeenCalledOnce();
  });

  it.each([
    ["previous нет", { current: A, previous: null }, true, "прежнего релиза (previous) нет"],
    [
      "previous совпадает с current",
      { current: A, previous: A },
      true,
      "previous совпадает с current",
    ],
    ["каталога previous нет", { current: A, previous: B }, false, "нет на сервере"],
  ])(
    "отказ: %s – ничего не включается, блокировка отпускается",
    async (_name, state, onServer, message) => {
      const { switchAndVerify, release, run } = setup({ state, previousOnServer: onServer });

      await expect(run()).rejects.toThrow(message);

      expect(switchAndVerify).not.toHaveBeenCalled();
      expect(release).toHaveBeenCalledOnce();
    },
  );

  it("previous нет: каталог не ищется", async () => {
    const { remote, run } = setup({ state: { current: A, previous: null } });

    await run().catch(() => {});

    expect(remote.releaseExists).not.toHaveBeenCalled();
  });

  it("неудача включения: ошибка проверки доходит до вызывающего, ничего лишнего не делается", async () => {
    const { switchAndVerify, run } = setup();
    switchAndVerify.mockRejectedValueOnce(new Error("возвращено на прежний релиз"));

    await expect(run()).rejects.toThrow("возвращено на прежний релиз");
  });
});
