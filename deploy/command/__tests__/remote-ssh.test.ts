import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createRemote } from "../remote.ts";
import { StepInterruptedError } from "../steps.ts";

/**
 * Настоящая `run` и настоящий вызов `ssh` из `createRemote`, но вместо `ssh` в PATH лежит
 * скрипт: он записывает номер своей группы процессов, 0,4 с «работает на сервере» и только потом
 * отмечает конец и печатает состояние указателей. Проверяется проводка сигналов: мягкая остановка
 * не трогает идущий шаг, жёсткая убивает его, а Ctrl+C в терминале шаг не задевает.
 */
const FAKE_SSH = `#!/bin/sh
echo $$ > "$FAKE_SSH_DIR/pid"
ps -o pgid= -p $$ | tr -d ' ' > "$FAKE_SSH_DIR/pgid"
sleep 0.4
touch "$FAKE_SSH_DIR/finished"
printf 'current=\\nprevious=\\n'
`;

let dir: string;
let savedPath: string | undefined;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "lists-fake-ssh-"));
  writeFileSync(join(dir, "ssh"), FAKE_SSH);
  chmodSync(join(dir, "ssh"), 0o755);
  savedPath = process.env.PATH;
  process.env.PATH = `${dir}:${savedPath}`;
  process.env.FAKE_SSH_DIR = dir;
});

afterEach(() => {
  process.env.PATH = savedPath;
  delete process.env.FAKE_SSH_DIR;
  rmSync(dir, { recursive: true, force: true });
});

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("проводка сигналов остановки к командам на сервере", () => {
  it("мягкая остановка не прерывает идущий шаг: он доходит до конца", async () => {
    const stop = new AbortController();
    const kill = new AbortController();
    const remote = createRemote({ stop: stop.signal, kill: kill.signal });

    const running = remote.readPointers();
    await pause(150);
    stop.abort(new Error("остановлено"));

    expect(await running).toEqual({ current: null, previous: null });
    expect(existsSync(join(dir, "finished"))).toBe(true);
  });

  it("жёсткое прерывание убивает идущий шаг: ошибка называет шаг, конца на сервере нет", async () => {
    const stop = new AbortController();
    const kill = new AbortController();
    const remote = createRemote({ stop: stop.signal, kill: kill.signal });

    const running = remote.readPointers();
    await pause(150);
    kill.abort();

    await expect(running).rejects.toBeInstanceOf(StepInterruptedError);
    await pause(500);
    expect(existsSync(join(dir, "finished"))).toBe(false);
  });

  it("команда на сервере идёт в своей группе процессов: Ctrl+C в терминале её не задевает", async () => {
    const controller = new AbortController();
    const remote = createRemote({ stop: controller.signal, kill: controller.signal });

    await remote.readPointers();

    const pid = readFileSync(join(dir, "pid"), "utf8").trim();
    const pgid = readFileSync(join(dir, "pgid"), "utf8").trim();
    expect(pgid).toBe(pid);
  });
});
