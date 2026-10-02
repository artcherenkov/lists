import { describe, expect, it, vi } from "vitest";

import { createEscalation, returnCancellation, stopWhenLockLost } from "../cancellation.ts";

describe("повторное прерывание", () => {
  function setup() {
    const actions = {
      onStop: vi.fn<() => void>(),
      onKill: vi.fn<() => void>(),
      onExit: vi.fn<() => void>(),
    };
    return { actions, interrupt: createEscalation(actions) };
  }

  it("первое просит остановиться между шагами и больше ничего не делает", () => {
    const { actions, interrupt } = setup();

    interrupt();

    expect(actions.onStop).toHaveBeenCalledTimes(1);
    expect(actions.onKill).not.toHaveBeenCalled();
    expect(actions.onExit).not.toHaveBeenCalled();
  });

  it("второе прерывает шаг на сервере, но не выходит", () => {
    const { actions, interrupt } = setup();

    interrupt();
    interrupt();

    expect(actions.onStop).toHaveBeenCalledTimes(1);
    expect(actions.onKill).toHaveBeenCalledTimes(1);
    expect(actions.onExit).not.toHaveBeenCalled();
  });

  it("третье и следующие выходят из процесса", () => {
    const { actions, interrupt } = setup();

    interrupt();
    interrupt();
    interrupt();
    interrupt();

    expect(actions.onStop).toHaveBeenCalledTimes(1);
    expect(actions.onKill).toHaveBeenCalledTimes(1);
    expect(actions.onExit).toHaveBeenCalledTimes(2);
  });
});

describe("потеря блокировки", () => {
  it("останавливает операцию так же, как первый Ctrl+C, и не убивает идущий шаг", () => {
    const stop = new AbortController();
    const kill = new AbortController();
    const lost = new AbortController();
    const operation = stopWhenLockLost({ stop: stop.signal, kill: kill.signal }, lost.signal);

    lost.abort(new Error("блокировка потеряна"));

    expect(operation.stop.aborted).toBe(true);
    expect(operation.stop.reason.message).toBe("блокировка потеряна");
    expect(operation.kill.aborted).toBe(false);
  });

  it("Ctrl+C по-прежнему останавливает операцию", () => {
    const stop = new AbortController();
    const operation = stopWhenLockLost(
      { stop: stop.signal, kill: new AbortController().signal },
      new AbortController().signal,
    );

    stop.abort(new Error("Ctrl+C"));

    expect(operation.stop.reason.message).toBe("Ctrl+C");
  });

  it("без потери блокировки и без Ctrl+C операция идёт", () => {
    const operation = stopWhenLockLost(
      { stop: new AbortController().signal, kill: new AbortController().signal },
      new AbortController().signal,
    );

    expect(operation.stop.aborted).toBe(false);
  });
});

describe("остановка возврата", () => {
  it("мягкая остановка возврат не прерывает, потеря блокировки прерывает, жёсткая остаётся той же", () => {
    const stop = new AbortController();
    const kill = new AbortController();
    const lockLost = new AbortController();
    const cancellation = returnCancellation(
      { stop: stop.signal, kill: kill.signal },
      lockLost.signal,
    );

    stop.abort(new Error("Ctrl+C"));
    expect(cancellation.stop.aborted).toBe(false);

    lockLost.abort(new Error("блокировка потеряна"));
    expect(cancellation.stop.aborted).toBe(true);
    expect(cancellation.kill).toBe(kill.signal);
  });
});
