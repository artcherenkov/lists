import { describe, expect, it } from "vitest";

import { importProbeLog } from "../probe-import.ts";
import { createJournalStore, JOURNAL_KEY } from "../store.ts";
import { brokenStorage, memoryStorage } from "./fake-storage.ts";

const probeEntries = (count: number) =>
  JSON.stringify(Array.from({ length: count }, (_, i) => ({ t: i, e: "launch", d: `p${i}` })));

describe("importProbeLog", () => {
  it("записи пробы встают в начало журнала, а три ключа пробы удаляются", () => {
    const storage = memoryStorage({
      "probe-log": probeEntries(2),
      "probe-state": "{}",
      "probe-marker-seen": "x",
      "probe-sw": "кеш не в localStorage, ключ чужой и остаётся",
    });
    const store = createJournalStore(storage, () => 9);
    store.append("уже есть");
    const moved = importProbeLog(storage, store);
    expect(moved).toBe(2);
    expect(store.entries().map((x) => x.text)).toEqual([
      "проба: launch p0",
      "проба: launch p1",
      "уже есть",
    ]);
    expect([...storage.data.keys()].sort()).toEqual(["app-journal", "probe-sw"]);
  });

  it("при переполнении вытесняются самые старые записи пробы", () => {
    const storage = memoryStorage({ "probe-log": probeEntries(600) });
    const store = createJournalStore(storage, () => 9);
    for (let i = 0; i < 600; i++) store.append(`j${i}`);
    importProbeLog(storage, store);
    expect(store.entries()).toHaveLength(1000);
    expect(store.entries()[0]?.text).toBe("проба: launch p200");
    expect(store.entries()[400]?.text).toBe("j0");
  });

  it("битый probe-log: журнал не меняется, ключи пробы удаляются", () => {
    const storage = memoryStorage({ "probe-log": "[{", "probe-state": "{}" });
    const store = createJournalStore(storage, () => 9);
    expect(importProbeLog(storage, store)).toBe(0);
    expect(store.entries()).toEqual([]);
    expect(storage.data.size).toBe(0);
  });

  it("пробы нет: журнал не пишется", () => {
    const storage = memoryStorage();
    const store = createJournalStore(storage, () => 9);
    expect(importProbeLog(storage, store)).toBe(0);
    expect(storage.data.has(JOURNAL_KEY)).toBe(false);
  });

  it("хранилище бросает: перенос не бросает", () => {
    const store = createJournalStore(brokenStorage, () => 9);
    expect(importProbeLog(brokenStorage, store)).toBe(0);
  });
});
