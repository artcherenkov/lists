import { describe, expect, it } from "vitest";

import {
  appendEntries,
  formatCopy,
  MAX_ENTRIES,
  normalizeText,
  parseEntries,
  parseProbeLog,
  prependEntries,
  type JournalEntry,
} from "../entries.ts";
import { moscow, useMoscowTime } from "./setup-time.ts";

const numbered = (prefix: string, count: number): JournalEntry[] =>
  Array.from({ length: count }, (_, i) => ({ t: i, text: `${prefix}${i}` }));

describe("вытеснение", () => {
  it("в журнале остаётся 1000 последних записей, самая старая уходит", () => {
    const next = appendEntries(numbered("a", 1000), [{ t: 5000, text: "новая" }]);
    expect(MAX_ENTRIES).toBe(1000);
    expect(next).toHaveLength(1000);
    expect(next[0]?.text).toBe("a1");
    expect(next.at(-1)?.text).toBe("новая");
  });

  it("до предела записи только добавляются", () => {
    expect(appendEntries(numbered("a", 2), [{ t: 9, text: "b" }]).map((x) => x.text)).toEqual([
      "a0",
      "a1",
      "b",
    ]);
  });

  it("старые записи ставятся в начало, а при переполнении уходят самые старые из них", () => {
    const next = prependEntries(numbered("j", 800), numbered("p", 600));
    expect(next).toHaveLength(1000);
    expect(next[0]?.text).toBe("p400");
    expect(next[199]?.text).toBe("p599");
    expect(next[200]?.text).toBe("j0");
  });
});

describe("normalizeText", () => {
  it("сводит переводы строк и повторные пробелы к одному пробелу", () => {
    expect(normalizeText("Error: плохо\n   at x\r\n")).toBe("Error: плохо at x");
  });

  it("обрезает длинный текст до 500 знаков", () => {
    expect(normalizeText("я".repeat(501))).toBe("я".repeat(500));
  });
});

describe("parseEntries", () => {
  it("нет ключа – журнала ещё нет", () => {
    expect(parseEntries(null)).toEqual([]);
  });

  it("битый JSON и не массив дают пустой журнал", () => {
    expect(parseEntries("{не json")).toEqual([]);
    expect(parseEntries('{"t":1,"text":"a"}')).toEqual([]);
  });

  it("негодные записи отбрасываются, годные остаются", () => {
    const raw = JSON.stringify([
      { t: 1, text: "годная" },
      { t: "1", text: "время строкой" },
      { t: 2 },
      null,
      "строка",
      { t: 3, text: "тоже годная" },
    ]);
    expect(parseEntries(raw)).toEqual([
      { t: 1, text: "годная" },
      { t: 3, text: "тоже годная" },
    ]);
  });
});

describe("parseProbeLog", () => {
  it("превращает запись пробы { t, e, d } в запись журнала с пометкой пробы", () => {
    const raw = JSON.stringify([
      { t: 100, e: "launch", d: "сборка=abc навигация=reload" },
      { t: 200, e: "pageshow", d: "" },
    ]);
    expect(parseProbeLog(raw)).toEqual([
      { t: 100, text: "проба: launch сборка=abc навигация=reload" },
      { t: 200, text: "проба: pageshow" },
    ]);
  });

  it("запись пробы с переводом строки остаётся одной строкой", () => {
    const raw = JSON.stringify([{ t: 1, e: "sw-message", d: "первая\nвторая" }]);
    expect(parseProbeLog(raw)).toEqual([{ t: 1, text: "проба: sw-message первая вторая" }]);
  });

  it("битый JSON, не массив и отсутствие ключа дают пустой список", () => {
    expect(parseProbeLog("[{")).toEqual([]);
    expect(parseProbeLog('{"t":1}')).toEqual([]);
    expect(parseProbeLog(null)).toEqual([]);
  });

  it("негодные записи пропускаются", () => {
    const raw = JSON.stringify([
      null,
      { t: 1, e: "a", d: "x" },
      { e: "без времени" },
      7,
      { t: 2 },
      { t: 3, e: "без подробностей" },
    ]);
    expect(parseProbeLog(raw)).toEqual([
      { t: 1, text: "проба: a x" },
      { t: 3, text: "проба: без подробностей" },
    ]);
  });
});

describe("formatCopy", () => {
  it("первая строка – версия, время снятия, часовой пояс, число записей и userAgent; дальше записи по одной на строку", () => {
    useMoscowTime();
    const text = formatCopy(
      [
        { t: moscow(2026, 10, 4, 12, 3, 1), text: "Запуск: версия 2026-10-04 · abc1234" },
        { t: moscow(2026, 10, 4, 12, 5, 9), text: "pagehide, persisted=false" },
      ],
      {
        version: "2026-10-04 · abc1234",
        takenAt: moscow(2026, 10, 4, 12, 10, 0),
        offsetMinutes: 180,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)",
      },
    );
    expect(text).toBe(
      [
        "Журнал приложения, версия 2026-10-04 · abc1234, снят 2026-10-04 12:10:00, часовой пояс UTC+03:00, записей 2, userAgent Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)",
        "2026-10-04 12:03:01 Запуск: версия 2026-10-04 · abc1234",
        "2026-10-04 12:05:09 pagehide, persisted=false",
      ].join("\n"),
    );
  });

  it("userAgent с переводом строки остаётся в первой строке", () => {
    useMoscowTime();
    const text = formatCopy([], {
      version: "v",
      takenAt: moscow(2026, 10, 4, 0, 0, 0),
      offsetMinutes: 0,
      userAgent: "UA\nвторая строка",
    });
    expect(text.split("\n")).toHaveLength(1);
    expect(text.endsWith("userAgent UA вторая строка")).toBe(true);
  });

  it("пустой журнал даёт одну строку с нулём записей", () => {
    useMoscowTime();
    const text = formatCopy([], {
      version: "v",
      takenAt: moscow(2026, 10, 4, 0, 0, 0),
      offsetMinutes: -330,
      userAgent: "UA",
    });
    expect(text).toBe(
      "Журнал приложения, версия v, снят 2026-10-04 00:00:00, часовой пояс UTC-05:30, записей 0, userAgent UA",
    );
  });
});
