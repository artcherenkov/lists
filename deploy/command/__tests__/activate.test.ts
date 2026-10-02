import { describe, expect, it, vi } from "vitest";

import { activateRelease, type ActivationInput } from "../activate.ts";
import { StoppedError, stopWhenLockLost } from "../cancellation.ts";
import { LockLostError, createRemote } from "../remote.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);
const BEFORE = { current: A, previous: C };
const PLAN = {
  deliver: false,
  switchPointers: true,
  recordActivation: true,
  next: { current: B, previous: A },
};

type Execute = (script: string) => Promise<string>;

const OK = { assessment: { kind: "ok" as const }, filesChecked: 4, attempts: 1 };

/**
 * Сценарий на настоящих `createRemote` с подменённым исполнителем: журнал `calls` – скрипты в
 * порядке выполнения, по ним видно, что ушло на сервер. Остановки собираются как в `deploy`:
 * `forward` останавливают мягкая остановка и потеря блокировки, `back` – только потеря блокировки.
 */
function setup(options: { execute?: Execute; verify?: ActivationInput["verify"] } = {}) {
  const stop = new AbortController();
  const kill = new AbortController();
  const lockLost = new AbortController();
  const calls: string[] = [];
  const execute: Execute = async (script) => {
    calls.push(script);
    return (await options.execute?.(script)) ?? "";
  };
  const operation = stopWhenLockLost({ stop: stop.signal, kill: kill.signal }, lockLost.signal);
  const verify = options.verify ?? vi.fn<ActivationInput["verify"]>(async () => OK);
  const input = (overrides: Partial<ActivationInput> = {}): ActivationInput => ({
    commit: B,
    plan: PLAN,
    stateBefore: BEFORE,
    forward: createRemote(operation, execute),
    back: createRemote({ stop: lockLost.signal, kill: kill.signal }, execute),
    stop: operation.stop,
    kill: kill.signal,
    verify,
    ...overrides,
  });
  return { stop, kill, lockLost, calls, verify, input };
}

const isSwitch = (script: string) => script.includes("mv -T");
const isUp = (script: string) => script.includes("up -d");
const isReload = (script: string) => script.includes("caddy reload");

/** Скрипты переключения указателей: прямой первым, возврат вторым. */
function switches(calls: string[]) {
  return calls.filter(isSwitch);
}

function pointerLines(script: string) {
  return {
    current: /ln -sfn releases\/(\w+) current\.new/.exec(script)?.[1],
    previous: /ln -sfn releases\/(\w+) previous\.new/.exec(script)?.[1],
    journal: /\n(printf '%s %s\\n'[^\n]*)/.exec(script)?.[1],
  };
}

describe("выкладка без неудач", () => {
  it("переключение, compose up, reload, проверка – в этом порядке, возврата нет", async () => {
    const { calls, input, verify } = setup();

    await expect(activateRelease(input())).resolves.toEqual(OK);

    expect(calls.map((c) => (isSwitch(c) ? "switch" : isUp(c) ? "up" : "reload"))).toEqual([
      "switch",
      "up",
      "reload",
    ]);
    expect(verify).toHaveBeenCalledOnce();
  });

  it("релиз уже текущий – только проверка: ничего не переключается", async () => {
    const { calls, input } = setup();

    await activateRelease(input({ plan: { ...PLAN, switchPointers: false } }));

    expect(calls).toEqual([]);
  });
});

describe("возврат после неудачного шага", () => {
  const failing: [string, (script: string) => boolean][] = [
    ["переключение указателей", isSwitch],
    ["compose up", isUp],
    ["caddy reload", isReload],
  ];

  it.each(failing)(
    "упал шаг «%s» – указатели как до выкладки, строка журнала, up и reload прежнего релиза",
    async (_name, fails) => {
      let failed = false;
      const { calls, input } = setup({
        execute: async (script) => {
          if (!failed && fails(script)) {
            failed = true;
            throw new Error("шаг упал");
          }
          return "";
        },
      });

      const error = await activateRelease(input()).catch((e) => e);

      expect(error.name).toBe("ReturnedError");
      expect(error.message).toContain(`current=${A}, previous=${C}`);
      expect(error.cause.cause.message).toContain("шаг упал");
      const [, back] = switches(calls);
      expect(pointerLines(back!)).toMatchObject({ current: A, previous: C });
      expect(pointerLines(back!).journal).toContain(A);
      expect(calls.slice(calls.indexOf(back!) + 1).map((c) => (isUp(c) ? "up" : "reload"))).toEqual(
        ["up", "reload"],
      );
    },
  );

  it("упал первый скрипт переключения: возврат всё равно ставит оба указателя, не переставляя их", async () => {
    let first = true;
    const { calls, input } = setup({
      execute: async (script) => {
        if (isSwitch(script) && first) {
          first = false;
          throw new Error("ssh оборвался между previous и current");
        }
        return "";
      },
    });

    await activateRelease(input()).catch(() => {});

    const [forward, back] = switches(calls);
    expect(pointerLines(forward!)).toMatchObject({ current: B, previous: A });
    expect(pointerLines(back!)).toMatchObject({ current: A, previous: C });
  });

  it("сайт ответил неверно – возврат; причины проверки в цепочке ошибки", async () => {
    const { calls, input } = setup({
      verify: async () => ({
        assessment: { kind: "rollback", reasons: ["/: в Cache-Control нет no-cache"] },
        filesChecked: 4,
        attempts: 1,
      }),
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnedError");
    expect(error.cause.message).toContain("/: в Cache-Control нет no-cache");
    expect(switches(calls)).toHaveLength(2);
    expect(calls.filter(isUp)).toHaveLength(2);
    expect(calls.filter(isReload)).toHaveLength(2);
  });

  it("у прежнего релиза не было previous – возврат удаляет ссылку previous", async () => {
    const { calls, input } = setup({
      verify: async () => ({ ...OK, assessment: { kind: "rollback", reasons: ["x"] } }),
    });

    await activateRelease(input({ stateBefore: { current: A, previous: null } })).catch(() => {});

    expect(switches(calls)[1]).toContain("rm -f previous");
  });

  it("первая выкладка: возвращаться некуда, сообщение называет это и команду осмотра", async () => {
    const { calls, input } = setup({
      verify: async () => ({ ...OK, assessment: { kind: "rollback", reasons: ["x"] } }),
    });

    const error = await activateRelease(
      input({ stateBefore: { current: null, previous: null } }),
    ).catch((e) => e);

    expect(error.name).toBe("FirstDeployFailedError");
    expect(error.message).toContain("возвращаться некуда");
    expect(error.message).toContain("readlink /opt/lists/current");
    expect(switches(calls)).toHaveLength(1);
  });

  it("первая выкладка, упал compose up: возвращаться некуда, сервисы повторно не запускаются", async () => {
    const { calls, input } = setup({
      execute: async (script) => {
        if (isUp(script)) throw new Error("compose упал");
        return "";
      },
    });

    const error = await activateRelease(
      input({ stateBefore: { current: null, previous: null } }),
    ).catch((e) => e);

    expect(error.name).toBe("FirstDeployFailedError");
    expect(calls.filter(isUp)).toHaveLength(1);
  });

  it("сам возврат упал – сообщение о промежуточном состоянии, прежние указатели и команда осмотра", async () => {
    let switchCalls = 0;
    const { input } = setup({
      execute: async (script) => {
        if (isUp(script)) throw new Error("compose упал");
        if (isSwitch(script) && ++switchCalls === 2) throw new Error("возврат упал");
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnFailedError");
    expect(error.message).toContain("промежуточное состояние");
    expect(error.message).toContain(`current=${A}, previous=${C}`);
    expect(error.message).toContain("readlink /opt/lists/current");
    expect(error.message).toContain("compose упал");
    expect(error.cause.cause.message).toContain("возврат упал");
  });

  it("проверка без переключения: неверный ответ – просто ошибка, ничего не возвращается", async () => {
    const { calls, input } = setup({
      verify: async () => ({
        assessment: { kind: "rollback", reasons: ["/: ответ 502 вместо 200"] },
        filesChecked: 4,
        attempts: 1,
      }),
    });

    const error = await activateRelease(input({ plan: { ...PLAN, switchPointers: false } })).catch(
      (e) => e,
    );

    expect(error.name).toBe("SiteCheckFailedError");
    expect(error.message).toContain("ответ 502 вместо 200");
    expect(calls).toEqual([]);
  });
});

describe("сайт не ответил", () => {
  const silent = async () => ({
    assessment: { kind: "unverified" as const, reason: "запрос не получил ответа" },
    filesChecked: 4,
    attempts: 7,
  });

  it("релиз остаётся включённым: возврата нет, ошибка советует повторить команду", async () => {
    const { calls, input } = setup({ verify: silent });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("SiteUnverifiedError");
    expect(error.message).toContain("не откатывался");
    expect(error.message).toContain(`pnpm deploy:v2 ${B}`);
    expect(switches(calls)).toHaveLength(1);
  });

  it("проверка текущего релиза: ошибка без возврата, говорит, что релиз не менялся", async () => {
    const { calls, input } = setup({ verify: silent });

    const error = await activateRelease(input({ plan: { ...PLAN, switchPointers: false } })).catch(
      (e) => e,
    );

    expect(error.name).toBe("SiteUnverifiedError");
    expect(error.message).toContain("не менялся");
    expect(calls).toEqual([]);
  });
});

describe("остановка и потеря блокировки", () => {
  it("мягкая остановка до переключения: сервер не менялся, ошибка – причина остановки", async () => {
    const { stop, calls, input } = setup();
    stop.abort(new StoppedError());

    await expect(activateRelease(input())).rejects.toBeInstanceOf(StoppedError);

    expect(calls).toEqual([]);
  });

  it("мягкая остановка после начала переключения compose up и reload не отменяет", async () => {
    const { stop, calls, input } = setup({
      execute: async (script) => {
        if (isSwitch(script)) stop.abort(new StoppedError());
        return "";
      },
      verify: async () => {
        stop.signal.throwIfAborted();
        return OK;
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(calls.filter(isUp)).toHaveLength(1);
    expect(calls.filter(isReload)).toHaveLength(1);
    expect(error.name).toBe("CheckStoppedError");
  });

  it("остановка во время проверки – не неудача: возврата нет, релиз остаётся включённым", async () => {
    const { stop, calls, input } = setup({
      verify: async () => {
        stop.abort(new StoppedError());
        throw stop.signal.reason;
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("CheckStoppedError");
    expect(error.message).toContain("остаётся включённым");
    expect(error.cause).toBeInstanceOf(StoppedError);
    expect(switches(calls)).toHaveLength(1);
  });

  it("мягкая остановка во время возврата его не прерывает: возврат доходит до конца", async () => {
    let stopped = false;
    const { stop, calls, input } = setup({
      execute: async (script) => {
        if (isUp(script) && !stopped) {
          stopped = true;
          stop.abort(new StoppedError());
          throw new Error("compose упал");
        }
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnedError");
    expect(switches(calls)).toHaveLength(2);
    expect(calls.filter(isUp)).toHaveLength(2);
    expect(calls.filter(isReload)).toHaveLength(1);
  });

  it("жёсткая остановка прерывает возврат: сообщение о промежуточном состоянии и команда осмотра", async () => {
    let attempts = 0;
    const { kill, input } = setup({
      execute: async (script) => {
        if (isUp(script)) {
          attempts += 1;
          if (attempts === 1) throw new Error("compose упал");
          kill.abort();
          throw new Error("ssh убит");
        }
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnFailedError");
    expect(error.message).toContain("промежуточное состояние");
    expect(error.message).toContain("readlink /opt/lists/current");
    expect(error.cause.name).toBe("StepInterruptedError");
  });

  it("жёсткая остановка прервала шаг вперёд: возврат не начинают, ошибка – прерванный шаг", async () => {
    const { kill, calls, input } = setup({
      execute: async (script) => {
        if (isUp(script)) {
          kill.abort();
          throw new Error("ssh убит");
        }
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("StepInterruptedError");
    expect(switches(calls)).toHaveLength(1);
  });

  it("блокировка потеряна до возврата: возврат не начинается, сообщение называет прежние указатели", async () => {
    const { lockLost, calls, input } = setup({
      execute: async (script) => {
        if (isUp(script)) {
          lockLost.abort(new LockLostError());
          throw new Error("compose упал");
        }
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnFailedError");
    expect(error.message).toContain(`current=${A}, previous=${C}`);
    expect(error.message).toContain("readlink /opt/lists/current");
    expect(error.cause).toBeInstanceOf(LockLostError);
    expect(switches(calls)).toHaveLength(1);
  });

  it("блокировка потеряна во время возврата: следующий шаг возврата не начинается", async () => {
    let upCalls = 0;
    const { lockLost, calls, input } = setup({
      execute: async (script) => {
        if (isUp(script)) {
          upCalls += 1;
          if (upCalls === 1) throw new Error("compose упал");
          lockLost.abort(new LockLostError());
        }
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnFailedError");
    expect(error.cause).toBeInstanceOf(LockLostError);
    expect(calls.filter(isReload)).toHaveLength(0);
  });

  it("блокировка потеряна между переключением указателей и compose up при возврате: compose up не начинается", async () => {
    let upCalls = 0;
    let switchCalls = 0;
    const { lockLost, calls, input } = setup({
      execute: async (script) => {
        if (isUp(script)) {
          upCalls += 1;
          if (upCalls === 1) throw new Error("compose упал");
        }
        if (isSwitch(script) && ++switchCalls === 2) lockLost.abort(new LockLostError());
        return "";
      },
    });

    const error = await activateRelease(input()).catch((e) => e);

    expect(error.name).toBe("ReturnFailedError");
    expect(calls.filter(isUp)).toHaveLength(1);
  });
});
