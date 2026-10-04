import { describe, expect, it } from "vitest";

import { formatDuration, formatOffset, formatTime } from "../format.ts";
import { moscow, useMoscowTime } from "./setup-time.ts";

describe("formatDuration", () => {
  const sec = 1000;
  const cases: [string, number, string][] = [
    ["ноль", 0, "0 с"],
    ["секунды", 5 * sec, "5 с"],
    ["минуты и секунды", 65 * sec, "1 мин 5 с"],
    ["часы с нулевыми младшими единицами", 3600 * sec, "1 ч 0 мин 0 с"],
    ["все единицы", (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * sec, "2 д 3 ч 4 мин 5 с"],
    ["дни с нулевыми внутренними единицами", 2 * 86400 * sec, "2 д 0 ч 0 мин 0 с"],
    ["округление вниз до секунды", 1499, "1 с"],
    ["округление вверх до секунды", 1500, "2 с"],
    ["отрицательная длительность (часы ушли назад)", -5 * sec, "0 с"],
  ];
  it.each(cases)("%s", (_name, ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});

describe("formatOffset", () => {
  it.each([
    [180, "+03:00"],
    [0, "+00:00"],
    [-330, "-05:30"],
    [345, "+05:45"],
  ])("%i мин – %s", (minutes, expected) => {
    expect(formatOffset(minutes)).toBe(expected);
  });
});

describe("formatTime", () => {
  it("выводит местное время до секунд", () => {
    useMoscowTime();
    // 09:03:01 UTC – 12:03:01 в Москве.
    expect(formatTime(Date.UTC(2026, 9, 4, 9, 3, 1))).toBe("2026-10-04 12:03:01");
    expect(formatTime(moscow(2026, 1, 2, 3, 4, 5))).toBe("2026-01-02 03:04:05");
  });
});
