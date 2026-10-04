import { describe, expect, it } from "vitest";

import { createJournalStore, JOURNAL_KEY } from "../store.ts";
import { fullStorage } from "./fake-storage.ts";

describe("хранилище читается, но не пишется (квота исчерпана)", () => {
  it("пока ключа нет, записи живут в памяти: каждая новая не стирает прежние", () => {
    const store = createJournalStore(fullStorage(), () => 1);
    store.append("первая");
    store.append("вторая");
    store.append("третья");
    expect(store.entries().map((x) => x.text)).toEqual(["первая", "вторая", "третья"]);
  });

  it("когда в хранилище осталась старая запись, новые записи не вытесняют друг друга", () => {
    const stored = JSON.stringify([{ t: 1, text: "прежняя" }]);
    const store = createJournalStore(fullStorage({ [JOURNAL_KEY]: stored }), () => 2);
    store.append("новая 1");
    store.append("новая 2");
    expect(store.entries().map((x) => x.text)).toEqual(["прежняя", "новая 1", "новая 2"]);
  });

  it("после очистки записи тоже не вытесняют друг друга", () => {
    const stored = JSON.stringify([{ t: 1, text: "прежняя" }]);
    const store = createJournalStore(fullStorage({ [JOURNAL_KEY]: stored }), () => 2);
    store.clear();
    store.append("новая 1");
    store.append("новая 2");
    expect(store.entries().map((x) => x.text)).toEqual(["новая 1", "новая 2"]);
  });
});
