import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

import { StoppedError } from "../cancellation.ts";
import { LockBusyError, LockLostError, acquireLock, type SpawnLockHolder } from "../remote.ts";

/** Держатель вместо `ssh`: локальная оболочка, которая играет роль сервера. */
function holder(serverScript: string): SpawnLockHolder {
  return () => spawn("sh", ["-c", serverScript], { stdio: ["pipe", "pipe", "pipe"] });
}

const OWNER = "abc 2026-10-03T00:00:00.000Z";
const noStop = new AbortController().signal;

describe("блокировка на сервере", () => {
  it("после LOCKED блокировка у нас, release закрывает держателя и потерей не считается", async () => {
    const lock = await acquireLock(OWNER, noStop, holder("echo LOCKED; cat >/dev/null"));

    await lock.release();

    expect(lock.lost.aborted).toBe(false);
  });

  it("занятая блокировка – отказ с владельцем", async () => {
    const acquiring = acquireLock(OWNER, noStop, holder("echo BUSY; echo 'другой 12:00'; exit 75"));

    await expect(acquiring).rejects.toBeInstanceOf(LockBusyError);
    await expect(acquiring).rejects.toThrow(
      "Другая выкладка или откат уже идут (другой 12:00). Дождись её конца и повтори.",
    );
  });

  it("другая ошибка держателя – отказ с кодом и выводом ошибок", async () => {
    const acquiring = acquireLock(OWNER, noStop, holder("echo 'нет доступа' >&2; exit 255"));

    await expect(acquiring).rejects.toThrow(/код 255[\s\S]*нет доступа/);
  });

  it("держатель закрылся сам после LOCKED: сигнал потери срабатывает с понятной причиной", async () => {
    const lock = await acquireLock(OWNER, noStop, holder("echo LOCKED; sleep 0.05"));

    await new Promise((resolve) => lock.lost.addEventListener("abort", resolve, { once: true }));

    expect(lock.lost.reason).toBeInstanceOf(LockLostError);
    expect(lock.lost.reason.message).toContain("Блокировка на сервере потеряна");
    expect(lock.lost.reason.message).toContain("readlink /opt/lists/current");
    await lock.release();
  });

  it("остановка до получения блокировки закрывает держателя, а заголовок ошибки – причина остановки", async () => {
    const stop = new AbortController();
    const acquiring = acquireLock(OWNER, stop.signal, holder("sleep 5"));

    stop.abort(new StoppedError());

    const error = await acquiring.catch((e) => e);
    expect(error).toBeInstanceOf(StoppedError);
    expect(error.message).not.toContain("Не удалось взять блокировку");
  });

  it("остановка без причины не подменяет отказ: держатель закрыт, ошибка с кодом", async () => {
    const stop = new AbortController();
    const acquiring = acquireLock(OWNER, stop.signal, holder("sleep 5"));

    stop.abort();

    await expect(acquiring).rejects.toThrow(/Не удалось взять блокировку/);
  });

  it("остановка после получения блокировки её не отпускает", async () => {
    const stop = new AbortController();
    const lock = await acquireLock(OWNER, stop.signal, holder("echo LOCKED; cat >/dev/null"));

    stop.abort();
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(lock.lost.aborted).toBe(false);
    await lock.release();
  });

  it("имя владельца с кавычкой не уходит в команду", async () => {
    await expect(acquireLock("a'; reboot; '", noStop, holder("exit 0"))).rejects.toThrow(
      /Недопустимое имя владельца/,
    );
  });
});
