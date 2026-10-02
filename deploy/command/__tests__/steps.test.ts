import { describe, expect, it, vi } from "vitest";

import { createStepRunner, StepInterruptedError, type ExecuteOnServer } from "../steps.ts";

function setup(execute = vi.fn<ExecuteOnServer>(async () => "вывод")) {
  const stop = new AbortController();
  const kill = new AbortController();
  const runStep = createStepRunner({ stop: stop.signal, kill: kill.signal }, execute);
  return { stop, kill, execute, runStep };
}

describe("шаги на сервере и остановка", () => {
  it("без остановки шаг выполняется и отдаёт вывод", async () => {
    const { runStep, execute } = setup();

    expect(await runStep("чтение", "echo 1")).toBe("вывод");
    expect(execute).toHaveBeenCalledWith("echo 1", undefined, expect.any(AbortSignal));
  });

  it("после мягкой остановки следующий шаг не начинается, причина – из сигнала", async () => {
    const { runStep, execute, stop } = setup();
    stop.abort(new Error("остановлено"));

    await expect(runStep("чтение", "echo 1")).rejects.toThrow("остановлено");
    expect(execute).not.toHaveBeenCalled();
  });

  it("шаг, который уже идёт, мягкая остановка не прерывает", async () => {
    let finish: (value: string) => void = () => {};
    const execute = vi.fn<ExecuteOnServer>(
      () => new Promise<string>((resolve) => (finish = resolve)),
    );
    const { runStep, stop, kill } = setup(execute);

    const running = runStep("долгий шаг", "sleep 1");
    stop.abort(new Error("остановлено"));
    finish("готово");

    expect(await running).toBe("готово");
    expect(kill.signal.aborted).toBe(false);
  });

  it("шаг без interruptible после мягкой остановки всё же выполняется", async () => {
    const { runStep, execute, stop } = setup();
    stop.abort(new Error("остановлено"));

    expect(await runStep("compose up", "docker compose up", { interruptible: false })).toBe(
      "вывод",
    );
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("жёсткое прерывание: ошибка называет шаг и предупреждает, что команда могла идти", async () => {
    const execute = vi.fn<ExecuteOnServer>(async () => {
      throw new Error("ssh прерван");
    });
    const { runStep, kill } = setup(execute);
    kill.abort();

    const error = await runStep("docker compose up", "x", { interruptible: false }).catch((e) => e);

    expect(error).toBeInstanceOf(StepInterruptedError);
    expect(error.message).toContain("«docker compose up»");
    expect(error.message).toContain("могла не закончиться");
    expect(error.message).toContain("readlink /opt/lists/current");
  });

  it("обычная ошибка шага называет шаг и сохраняет причину", async () => {
    const cause = new Error("код 1");
    const { runStep } = setup(
      vi.fn<ExecuteOnServer>(async () => {
        throw cause;
      }),
    );

    const error = await runStep("caddy validate", "x").catch((e) => e);

    expect(error).not.toBeInstanceOf(StepInterruptedError);
    expect(error.message).toBe("Шаг «caddy validate» на сервере не выполнен");
    expect(error.cause).toBe(cause);
  });

  it("вход шага передаётся исполнителю", async () => {
    const { runStep, execute } = setup();
    const input = new Uint8Array([1, 2]);

    await runStep("доставка", "tar -x", { input });

    expect(execute).toHaveBeenCalledWith("tar -x", input, expect.any(AbortSignal));
  });
});
