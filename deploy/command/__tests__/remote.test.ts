import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";

import { StoppedError } from "../cancellation.ts";
import { createRemote } from "../remote.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);

function setup() {
  const stop = new AbortController();
  const kill = new AbortController();
  const execute = vi.fn<(script: string) => Promise<string>>(async () => "");
  const remote = createRemote({ stop: stop.signal, kill: kill.signal }, execute);
  return { stop, execute, remote };
}

describe("шаги выкладки на сервере", () => {
  it("после мягкой остановки compose up и reload всё же выполняются: релиз не остаётся наполовину", async () => {
    const { stop, execute, remote } = setup();
    stop.abort(new Error("остановлено"));

    await remote.composeUp();
    await remote.caddyReload();

    expect(execute.mock.calls.map(([script]) => script)).toEqual([
      expect.stringContaining("up -d --wait"),
      expect.stringContaining("caddy reload"),
    ]);
  });

  it("после мягкой остановки остальные шаги не начинаются", async () => {
    const { stop, execute, remote } = setup();
    stop.abort(new Error("остановлено"));

    await expect(remote.switchPointers({ current: B, previous: A }, true)).rejects.toThrow(
      "остановлено",
    );
    await expect(remote.readPointers()).rejects.toThrow("остановлено");
    await expect(remote.validateCaddyfile(A)).rejects.toThrow("остановлено");
    expect(execute).not.toHaveBeenCalled();
  });

  it("запись в журнал входит в скрипт переключения, когда план её требует", async () => {
    const { execute, remote } = setup();

    await remote.switchPointers({ current: B, previous: A }, true);
    await remote.switchPointers({ current: B, previous: A }, false);

    const [withLog, withoutLog] = execute.mock.calls.map(([script]) => script);
    expect(withLog).toContain(`${B} >> /opt/lists/releases.log`);
    expect(withoutLog).not.toContain("releases.log");
  });

  it("остановка при упаковке архива – ошибка называет причину остановки, а не «The operation was aborted»", async () => {
    const { stop, execute, remote } = setup();
    stop.abort(new StoppedError());

    const error = await remote.deliver(A, tmpdir()).catch((e) => e);

    expect(error).toBeInstanceOf(StoppedError);
    expect(execute).not.toHaveBeenCalled();
  });

  it("с interruptible: true compose up и reload останавливаются мягкой остановкой, как остальные шаги", async () => {
    const { stop, execute, remote } = setup();
    stop.abort(new Error("блокировка потеряна"));

    await expect(remote.composeUp({ interruptible: true })).rejects.toThrow("блокировка потеряна");
    await expect(remote.caddyReload({ interruptible: true })).rejects.toThrow(
      "блокировка потеряна",
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it("удаление релизов: один rm -rf на каталоги указанных хешей, без хешей – ни одной команды", async () => {
    const { execute, remote } = setup();

    await remote.removeReleases([]);
    await remote.removeReleases([A, B]);

    expect(execute).toHaveBeenCalledOnce();
    expect(execute.mock.calls[0]![0]).toBe(
      `rm -rf /opt/lists/releases/${A} /opt/lists/releases/${B}`,
    );
  });

  it("удаление отказывается от имени не из хеша: путь в shell не уходит", async () => {
    const { execute, remote } = setup();

    await expect(remote.removeReleases(["../current"])).rejects.toThrow(/полный хеш/);
    expect(execute).not.toHaveBeenCalled();
  });

  it("список релизов – имена из вывода ls, пустые строки отброшены", async () => {
    const { execute, remote } = setup();
    execute.mockResolvedValueOnce(`${A}\nbackup\n\n${B}\n`);

    expect(await remote.listReleases()).toEqual([A, "backup", B]);
    expect(execute.mock.calls[0]![0]).toBe("ls -1 /opt/lists/releases");
  });

  it("журнал читается целиком, ошибка чтения не глушится", async () => {
    const { execute, remote } = setup();
    execute.mockResolvedValueOnce("строка\n");

    expect(await remote.readReleaseLog()).toBe("строка\n");
    expect(execute.mock.calls[0]![0]).toBe("cat /opt/lists/releases.log");
  });
});
