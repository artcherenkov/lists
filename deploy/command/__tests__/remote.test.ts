import { describe, expect, it, vi } from "vitest";

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
});
