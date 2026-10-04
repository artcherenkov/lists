import { describe, expect, it } from "vitest";

import { recordPersistence } from "../persistence.ts";

function fakeStorage(options: { persisted?: boolean[]; persist?: boolean | Error } = {}) {
  const persistedAnswers = [...(options.persisted ?? [false, true])];
  const calls = { persist: 0, persisted: 0 };
  return {
    calls,
    storage: {
      persisted: () => {
        calls.persisted++;
        return Promise.resolve(persistedAnswers.shift() ?? false);
      },
      persist: () => {
        calls.persist++;
        return options.persist instanceof Error
          ? Promise.reject(options.persist)
          : Promise.resolve(options.persist ?? true);
      },
    },
  };
}

async function run(
  storage: Parameters<typeof recordPersistence>[0]["storage"],
  homeScreen: boolean,
) {
  const lines: string[] = [];
  await recordPersistence({ storage, homeScreen, log: (text) => lines.push(text) });
  return lines;
}

describe("recordPersistence", () => {
  it("с экрана «Домой» вызывает persist() один раз и пишет persisted() до и после", async () => {
    const { storage, calls } = fakeStorage({ persisted: [false, true], persist: true });
    expect(await run(storage, true)).toEqual([
      "persisted() до: нет; persist() ответил: да; persisted() после: да",
    ]);
    expect(calls).toEqual({ persist: 1, persisted: 2 });
  });

  it("отказ платформы записывается как ответ «нет»", async () => {
    const { storage } = fakeStorage({ persisted: [false, false], persist: false });
    expect(await run(storage, true)).toEqual([
      "persisted() до: нет; persist() ответил: нет; persisted() после: нет",
    ]);
  });

  it("во вкладке persist() не вызывается, журнал пишет причину и persisted()", async () => {
    const { storage, calls } = fakeStorage({ persisted: [true] });
    expect(await run(storage, false)).toEqual([
      "persist() не вызван: приложение открыто во вкладке, а не с экрана «Домой»; persisted() = да",
    ]);
    expect(calls).toEqual({ persist: 0, persisted: 1 });
  });

  it("ошибка persist() попадает в запись и не бросается", async () => {
    const { storage } = fakeStorage({ persist: new Error("отказ") });
    expect(await run(storage, true)).toEqual([
      "persisted() до: нет; persist() ответил: ошибка (Error: отказ); persisted() после: да",
    ]);
  });

  it("отклонённый persisted() до и после записывается ошибкой, persist() всё равно вызывается", async () => {
    const calls = { persist: 0 };
    const storage = {
      persisted: () => Promise.reject(new Error("нет доступа")),
      persist: () => {
        calls.persist++;
        return Promise.resolve(true);
      },
    };
    expect(await run(storage, true)).toEqual([
      "persisted() до: ошибка (Error: нет доступа); persist() ответил: да; persisted() после: ошибка (Error: нет доступа)",
    ]);
    expect(calls.persist).toBe(1);
  });

  it("отклонённый persisted() во вкладке записывается ошибкой", async () => {
    const storage = {
      persisted: () => Promise.reject(new Error("нет доступа")),
      persist: () => Promise.resolve(true),
    };
    expect(await run(storage, false)).toEqual([
      "persist() не вызван: приложение открыто во вкладке, а не с экрана «Домой»; persisted() = ошибка (Error: нет доступа)",
    ]);
  });

  it("платформа с persist(), но без persisted() считается без поддержки и persist() не вызывает", async () => {
    let called = false;
    const storage = {
      persist: () => {
        called = true;
        return Promise.resolve(true);
      },
    } as unknown as Parameters<typeof recordPersistence>[0]["storage"];
    expect(await run(storage, true)).toEqual(["persist(): navigator.storage.persist недоступен"]);
    expect(called).toBe(false);
  });

  it("платформа без navigator.storage.persist", async () => {
    expect(await run(undefined, true)).toEqual(["persist(): navigator.storage.persist недоступен"]);
  });
});
