import type { Remote } from "../remote.ts";

import { describe, expect, it, vi } from "vitest";

import { StoppedError } from "../cancellation.ts";
import { LockLostError } from "../remote.ts";
import { withServerLock, type LockDeps } from "../with-lock.ts";

function setup() {
  const lost = new AbortController();
  const release = vi.fn<() => Promise<void>>(async () => {});
  const remote = {} as Remote;
  const acquireLock = vi.fn<LockDeps["acquireLock"]>(async () => ({ lost: lost.signal, release }));
  const createRemote = vi.fn<LockDeps["createRemote"]>(() => remote);
  const stop = new AbortController();
  const cancel = { stop: stop.signal, kill: new AbortController().signal };
  return { lost, release, remote, acquireLock, createRemote, stop, cancel };
}

describe("работа под блокировкой", () => {
  it("блокировка берётся с владельцем и мягкой остановкой, работа получает сервер на общей остановке", async () => {
    const { lost, remote, acquireLock, createRemote, stop, cancel } = setup();

    const result = await withServerLock(
      "owner 1",
      cancel,
      async (context) => {
        expect(context.remote).toBe(remote);
        return context.operation;
      },
      { acquireLock, createRemote },
    );

    expect(acquireLock).toHaveBeenCalledWith("owner 1", cancel.stop);
    expect(createRemote).toHaveBeenCalledWith(result);
    expect(result.stop.aborted).toBe(false);
    lost.abort(new LockLostError());
    expect(result.stop.aborted).toBe(true);
    expect(stop.signal.aborted).toBe(false);
  });

  it("блокировка отпускается после работы и после ошибки", async () => {
    const ok = setup();
    await withServerLock("o", ok.cancel, async () => {}, ok);
    const failing = setup();
    await expect(
      withServerLock(
        "o",
        failing.cancel,
        async () => {
          throw new StoppedError();
        },
        failing,
      ),
    ).rejects.toBeInstanceOf(StoppedError);

    expect(ok.release).toHaveBeenCalledOnce();
    expect(failing.release).toHaveBeenCalledOnce();
  });

  it("блокировку не взяли – работа не начинается", async () => {
    const { createRemote, cancel } = setup();
    const work = vi.fn<() => Promise<void>>(async () => {});

    await expect(
      withServerLock("o", cancel, work, {
        acquireLock: async () => {
          throw new Error("занято");
        },
        createRemote,
      }),
    ).rejects.toThrow("занято");

    expect(work).not.toHaveBeenCalled();
  });
});
