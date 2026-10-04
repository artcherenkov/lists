import { describe, expect, it } from "vitest";

import { createJournalStore, JOURNAL_KEY } from "../store.ts";
import { brokenStorage, fullStorage, memoryStorage } from "./fake-storage.ts";

function clock(...times: number[]) {
  let i = 0;
  return () => times[Math.min(i++, times.length - 1)]!;
}

describe("запись", () => {
  it("запись получает время часов, и новый журнал над тем же хранилищем её видит", () => {
    const storage = memoryStorage();
    createJournalStore(storage, clock(1000)).append("Запуск");
    const reopened = createJournalStore(storage, clock(2000));
    expect(reopened.entries()).toEqual([{ t: 1000, text: "Запуск" }]);
    reopened.append("Возврат");
    expect(reopened.entries()).toEqual([
      { t: 1000, text: "Запуск" },
      { t: 2000, text: "Возврат" },
    ]);
  });

  it("текст записи сводится к одной строке", () => {
    const store = createJournalStore(memoryStorage(), clock(1));
    store.append("Error: плохо\n  at x");
    expect(store.entries()[0]?.text).toBe("Error: плохо at x");
  });

  it("после 1001 записи остаются последние 1000", () => {
    const store = createJournalStore(memoryStorage(), () => 1);
    for (let i = 0; i < 1001; i++) store.append(`событие ${i}`);
    expect(store.entries()).toHaveLength(1000);
    expect(store.entries()[0]?.text).toBe("событие 1");
    expect(store.entries().at(-1)?.text).toBe("событие 1000");
  });

  it("записи другой вкладки, появившиеся в хранилище, не теряются", () => {
    const storage = memoryStorage();
    const first = createJournalStore(storage, () => 1);
    const second = createJournalStore(storage, () => 2);
    first.append("из первой");
    second.append("из второй");
    first.append("снова из первой");
    expect(first.entries().map((x) => x.text)).toEqual([
      "из первой",
      "из второй",
      "снова из первой",
    ]);
  });
});

describe("сбой хранилища", () => {
  it("битый JSON: журнал начинает заново и перезаписывает хранилище", () => {
    const storage = memoryStorage({ [JOURNAL_KEY]: "{не json" });
    const store = createJournalStore(storage, () => 7);
    expect(store.entries()).toEqual([]);
    store.append("Запуск");
    expect(JSON.parse(storage.data.get(JOURNAL_KEY)!)).toEqual([{ t: 7, text: "Запуск" }]);
  });

  it("данные испортились после записей: хранилище начинается заново", () => {
    const storage = memoryStorage();
    const store = createJournalStore(storage, () => 1);
    store.append("до порчи");
    storage.data.set(JOURNAL_KEY, "{");
    store.append("после порчи");
    expect(store.entries().map((x) => x.text)).toEqual(["после порчи"]);
  });

  it("хранилище бросает на каждом обращении: запись не бросает, записи живут в памяти", () => {
    const store = createJournalStore(brokenStorage, () => 1);
    expect(() => {
      store.append("первая");
      store.append("вторая");
    }).not.toThrow();
    expect(store.entries().map((x) => x.text)).toEqual(["первая", "вторая"]);
  });

  it("квота исчерпана: запись не бросает, прежние записи остаются", () => {
    const stored = JSON.stringify([{ t: 1, text: "прежняя" }]);
    const store = createJournalStore(fullStorage({ [JOURNAL_KEY]: stored }), () => 2);
    expect(() => store.append("новая")).not.toThrow();
    expect(store.entries().map((x) => x.text)).toEqual(["прежняя", "новая"]);
  });

  it("запись удалась, следующая нет: удавшаяся запись остаётся подтверждённой, новая живёт в памяти", () => {
    let writes = 0;
    const base = memoryStorage();
    const storage = {
      ...base,
      setItem: (key: string, value: string) => {
        if (writes++ > 0) throw new Error("QuotaExceededError");
        base.setItem(key, value);
      },
    };
    const store = createJournalStore(storage, () => 1);
    store.append("первая");
    store.append("вторая");
    store.append("третья");
    expect(store.entries().map((x) => x.text)).toEqual(["первая", "вторая", "третья"]);
  });

  it("чтение хранилища стало бросать после записей: записи в памяти остаются", () => {
    const base = memoryStorage();
    let broken = false;
    const storage = {
      ...base,
      getItem: (key: string) => {
        if (broken) throw new Error("SecurityError");
        return base.getItem(key);
      },
    };
    const store = createJournalStore(storage, () => 1);
    store.append("первая");
    broken = true;
    store.append("вторая");
    expect(store.entries().map((x) => x.text)).toEqual(["первая", "вторая"]);
  });

  it("хранилища нет совсем: журнал работает в памяти", () => {
    const store = createJournalStore(undefined, () => 1);
    store.append("запись");
    expect(store.entries()).toHaveLength(1);
  });

  it("очистка и перенос тоже не бросают при сбое хранилища", () => {
    const store = createJournalStore(brokenStorage, () => 1);
    expect(() => {
      store.prepend([{ t: 0, text: "старая" }]);
      store.clear();
    }).not.toThrow();
    expect(store.entries()).toEqual([]);
  });
});

describe("очистка и подписка", () => {
  it("очистка стирает записи в памяти и хранилище", () => {
    const storage = memoryStorage();
    const store = createJournalStore(storage, () => 1);
    store.append("запись");
    store.clear();
    expect(store.entries()).toEqual([]);
    expect(createJournalStore(storage, () => 2).entries()).toEqual([]);
  });

  it("подписчик узнаёт о записи, очистке и переносе; после отписки молчит", () => {
    const store = createJournalStore(memoryStorage(), () => 1);
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.append("a");
    store.prepend([{ t: 0, text: "старая" }]);
    store.clear();
    expect(calls).toBe(3);
    unsubscribe();
    store.append("b");
    expect(calls).toBe(3);
  });

  it("подписчик, бросивший исключение, не мешает записи и другим подписчикам", () => {
    const store = createJournalStore(memoryStorage(), () => 1);
    let reached = 0;
    store.subscribe(() => {
      throw new Error("сбой подписчика");
    });
    store.subscribe(() => reached++);
    expect(() => store.append("a")).not.toThrow();
    expect(() => store.prepend([{ t: 0, text: "старая" }])).not.toThrow();
    expect(() => store.clear()).not.toThrow();
    expect(reached).toBe(3);
  });

  it("очистка при отказе удаления ключа не возвращает стёртые записи", () => {
    const stored = JSON.stringify([{ t: 1, text: "прежняя" }]);
    const storage = { ...memoryStorage({ [JOURNAL_KEY]: stored }), removeItem: () => {} };
    const store = createJournalStore(storage, () => 2);
    store.clear();
    store.append("новая");
    expect(store.entries().map((x) => x.text)).toEqual(["новая"]);
  });

  it("ссылка на записи не меняется, пока записей не прибавилось", () => {
    const store = createJournalStore(memoryStorage(), () => 1);
    store.append("a");
    const before = store.entries();
    expect(store.entries()).toBe(before);
    store.append("b");
    expect(store.entries()).not.toBe(before);
  });
});
