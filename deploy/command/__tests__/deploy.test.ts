import { describe, expect, it, vi } from "vitest";

import { switchToRelease } from "../deploy.ts";
import { createRemote } from "../remote.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const BEFORE = { current: A, previous: null };
const PLAN = {
  deliver: false,
  switchPointers: true,
  recordActivation: true,
  next: { current: B, previous: A },
};

function setup(execute = vi.fn<(script: string) => Promise<string>>(async () => "")) {
  const stop = new AbortController();
  const kill = new AbortController();
  const remote = createRemote({ stop: stop.signal, kill: kill.signal }, execute);
  return { stop, execute, remote };
}

describe("переключение на релиз", () => {
  it("остановка до начала переключения: сервер не менялся, ошибка – причина остановки, а не «после переключения»", async () => {
    const { stop, remote, execute } = setup();
    stop.abort(new Error("блокировка потеряна"));

    await expect(switchToRelease(remote, PLAN, BEFORE, stop.signal)).rejects.toThrow(
      "блокировка потеряна",
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("ошибка шага после начала переключения – ошибка после переключения с прежним состоянием", async () => {
    const execute = vi.fn<(script: string) => Promise<string>>(async (script) => {
      if (script.includes("up -d")) throw new Error("compose упал");
      return "";
    });
    const { stop, remote } = setup(execute);

    const error = await switchToRelease(remote, PLAN, BEFORE, stop.signal).catch((e) => e);

    expect(error.name).toBe("AfterSwitchError");
    expect(error.message).toContain(`current=${A}, previous=нет`);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("остановка после начала переключения compose up и reload не отменяет", async () => {
    const { stop, remote, execute } = setup();

    const switching = switchToRelease(remote, PLAN, BEFORE, stop.signal);
    stop.abort(new Error("Ctrl+C"));
    await switching;

    expect(execute).toHaveBeenCalledTimes(3);
  });
});
