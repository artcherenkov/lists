import type { ActivationInput } from "../activate.ts";

import { describe, expect, it, vi } from "vitest";

import { StoppedError } from "../cancellation.ts";
import { FIRST_DEPLOY_VERIFY_DEADLINE_MS, VERIFY_DEADLINE_MS } from "../config.ts";
import { LockLostError } from "../remote.ts";
import { switchAndVerify, type SwitchAndVerifyDeps } from "../switch-and-verify.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const SWITCHING = {
  deliver: false,
  switchPointers: true,
  recordActivation: true,
  next: { current: B, previous: A },
};
const NOT_SWITCHING = { ...SWITCHING, switchPointers: false, recordActivation: false };
const CHECKSUMS = `${"1".repeat(64)}  site/index.html\n${"2".repeat(64)}  site/sw.js\n`;
const OK = { assessment: { kind: "ok" as const }, filesChecked: 4, attempts: 1 };

/** Проводка на подменённых зависимостях: журнал `events` хранит порядок и аргументы вызовов. */
function setup(overrides: { plan?: typeof SWITCHING; firstDeploy?: boolean } = {}) {
  const stop = new AbortController();
  const kill = new AbortController();
  const lockLost = new AbortController();
  const events: string[] = [];

  const noop = () => vi.fn<() => Promise<void>>(async () => {});
  const back = { switchPointers: noop(), composeUp: noop(), caddyReload: noop() };
  const createRemote = vi.fn<SwitchAndVerifyDeps["createRemote"]>(() => back);
  const verifySite = vi.fn<SwitchAndVerifyDeps["verifySite"]>(async () => OK);
  const activateRelease = vi.fn<(input: ActivationInput) => Promise<typeof OK>>(async (input) => {
    events.push("activate");
    return input.verify() as Promise<typeof OK>;
  });
  const forward = {
    readChecksums: vi.fn<(commit: string) => Promise<string>>(async () => {
      events.push("read");
      return CHECKSUMS;
    }),
    validateCaddyfile: vi.fn<(commit: string) => Promise<void>>(async () => {
      events.push("validate");
    }),
    switchPointers: noop(),
    composeUp: noop(),
    caddyReload: noop(),
  };

  const run = () =>
    switchAndVerify(
      {
        commit: B,
        plan: overrides.plan ?? SWITCHING,
        stateBefore: { current: overrides.firstDeploy ? null : A, previous: null },
        remote: forward,
        cancel: { stop: stop.signal, kill: kill.signal },
        lock: { lost: lockLost.signal },
      },
      { createRemote, verifySite, activateRelease } as unknown as SwitchAndVerifyDeps,
    );
  return {
    stop,
    kill,
    lockLost,
    events,
    back,
    forward,
    createRemote,
    verifySite,
    activateRelease,
    run,
  };
}

describe("проводка переключения и проверки", () => {
  it("caddy validate идёт до переключения, если указатели меняются", async () => {
    const { events, forward, run } = setup();

    await run();

    expect(forward.validateCaddyfile).toHaveBeenCalledWith(B);
    expect(events).toEqual(["read", "validate", "activate"]);
  });

  it("суммы читаются у выкладываемого релиза до caddy validate, разобранные записи идут в проверку сайта", async () => {
    const { events, forward, verifySite, run } = setup();

    await run();

    expect(forward.readChecksums).toHaveBeenCalledWith(B);
    expect(events.indexOf("read")).toBeLessThan(events.indexOf("validate"));
    expect(verifySite.mock.calls[0]![1]).toEqual([
      { sha256: "1".repeat(64), path: "site/index.html" },
      { sha256: "2".repeat(64), path: "site/sw.js" },
    ]);
  });

  it("релиз уже текущий: caddy validate не нужен", async () => {
    const { forward, run } = setup({ plan: NOT_SWITCHING });

    await run();

    expect(forward.validateCaddyfile).not.toHaveBeenCalled();
  });

  it("в возврат идёт отдельный Remote: мягкая остановка его не прерывает, потеря блокировки прерывает", async () => {
    const { stop, lockLost, kill, back, createRemote, activateRelease, run } = setup();

    await run();

    const [returnCancel] = createRemote.mock.calls[0]!;
    expect(activateRelease.mock.calls[0]![0].back).toBe(back);
    stop.abort(new StoppedError());
    expect(returnCancel.stop.aborted).toBe(false);
    lockLost.abort(new LockLostError());
    expect(returnCancel.stop.aborted).toBe(true);
    expect(returnCancel.kill).toBe(kill.signal);
  });

  it("шаги вперёд останавливаются мягкой остановкой и потерей блокировки", async () => {
    const { stop, forward, activateRelease, run } = setup();

    await run();

    const input = activateRelease.mock.calls[0]![0];
    expect(input.forward).toBe(forward);
    expect(input.stop.aborted).toBe(false);
    stop.abort(new StoppedError());
    expect(input.stop.aborted).toBe(true);
  });

  it("жёсткая остановка доходит до возврата: после неё возврат не начинают", async () => {
    const { kill, activateRelease, run } = setup();

    await run();

    const { kill: passed } = activateRelease.mock.calls[0]![0];
    expect(passed.aborted).toBe(false);
    kill.abort();
    expect(passed.aborted).toBe(true);
  });

  it("проверка сайта: срок обычный, а при первой выкладке дольше", async () => {
    const usual = setup();
    await usual.run();
    const first = setup({ firstDeploy: true });
    await first.run();

    expect(usual.verifySite.mock.calls[0]![2].deadlineMs).toBe(VERIFY_DEADLINE_MS);
    expect(first.verifySite.mock.calls[0]![2].deadlineMs).toBe(FIRST_DEPLOY_VERIFY_DEADLINE_MS);
    expect(first.verifySite.mock.calls[0]![2].retryDelayMs).toBeGreaterThan(0);
  });

  it("проверка сайта прерывается мягкой остановкой и потерей блокировки", async () => {
    const { stop, verifySite, run } = setup();

    await run();

    const { signal } = verifySite.mock.calls[0]![2];
    expect(signal?.aborted).toBe(false);
    stop.abort(new StoppedError());
    expect(signal?.aborted).toBe(true);

    const second = setup();
    await second.run();
    const lostSignal = second.verifySite.mock.calls[0]![2].signal;
    second.lockLost.abort(new LockLostError());
    expect(lostSignal?.aborted).toBe(true);
  });
});
