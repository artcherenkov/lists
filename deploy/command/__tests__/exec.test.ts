import { describe, expect, it } from "vitest";

import { CommandError, run } from "../exec.ts";

/** Номер группы процессов и номер самого процесса оболочки: у `detached` они совпадают. */
async function groupAndPid(detached: boolean): Promise<{ group: number; pid: number }> {
  const { stdout } = await run("sh", ["-c", "ps -o pgid= -p $$; echo $$"], { detached });
  const [group, pid] = stdout.trim().split(/\s+/).map(Number);
  return { group: group!, pid: pid! };
}

describe("запуск команд", () => {
  it("отдаёт вывод и принимает ввод", async () => {
    const { stdout } = await run("cat", [], { input: "привет" });

    expect(stdout).toBe("привет");
  });

  it("ненулевой код – ошибка с хвостом вывода ошибок", async () => {
    const error = await run("sh", ["-c", "echo причина >&2; exit 3"]).catch((e) => e);

    expect(error).toBeInstanceOf(CommandError);
    expect(error.message).toContain("код 3");
    expect(error.message).toContain("причина");
  });

  it("detached запускает команду в своей группе процессов, без него – в группе родителя", async () => {
    const detached = await groupAndPid(true);
    const attached = await groupAndPid(false);

    expect(detached.group).toBe(detached.pid);
    expect(attached.group).not.toBe(attached.pid);
  });

  it("сигнал прерывает команду", async () => {
    const controller = new AbortController();
    const running = run("sleep", ["5"], { signal: controller.signal });

    controller.abort();

    await expect(running).rejects.toThrow(/прервано/);
  });

  it("остановка с причиной отдаёт её саму, а не «прервано»", async () => {
    const controller = new AbortController();
    const running = run("sleep", ["5"], { signal: controller.signal });

    controller.abort(new Error("блокировка потеряна"));

    await expect(running).rejects.toThrow("блокировка потеряна");
  });

  it("остановка с причиной не из Error ничего не подменяет: команда прервана, как обычно", async () => {
    const controller = new AbortController();
    const running = run("sleep", ["5"], { signal: controller.signal });

    controller.abort("просто строка");

    const error = await running.catch((e) => e);
    expect(error).toBeInstanceOf(CommandError);
    expect(error.message).toMatch(/прервано/);
  });
});
