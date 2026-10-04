import { expect, test } from "vitest";

import { escapeRegExp, journalLine } from "../journal-line.ts";

test("строка с любым временем и тем же текстом подходит", () => {
  expect(
    journalLine("pagehide, persisted=false").test("2026-10-04 12:03:01 pagehide, persisted=false"),
  ).toBe(true);
});

test.each([
  ["другой текст", "2026-10-04 12:03:01 pagehide, persisted=true"],
  ["текст в середине строки", "2026-10-04 12:03:01 событие: pagehide, persisted=false"],
  ["продолжение после текста", "2026-10-04 12:03:01 pagehide, persisted=false, в фоне 3 с"],
  ["время неверного формата", "12:03:01 pagehide, persisted=false"],
])("строка с текстом не подходит: %s", (_, line) => {
  expect(journalLine("pagehide, persisted=false").test(line)).toBe(false);
});

test("знаки регулярного выражения в тексте – обычные знаки", () => {
  expect(
    journalLine("persist() ответил: да (1+1)").test(
      "2026-10-04 12:03:01 persist() ответил: да (1+1)",
    ),
  ).toBe(true);
  expect(journalLine("persist() ответил: да").test("2026-10-04 12:03:01 persist ответил: да")).toBe(
    false,
  );
});

test("регулярное выражение продолжает строку после времени", () => {
  const line = journalLine(/Запуск: версия .+, видимость visible$/);
  expect(
    line.test("2026-10-04 12:03:01 Запуск: версия 2026-10-04 · abc1234, видимость visible"),
  ).toBe(true);
  expect(
    line.test("2026-10-04 12:03:01 Запуск: версия 2026-10-04 · abc1234, видимость hidden"),
  ).toBe(false);
});

test("escapeRegExp экранирует все служебные знаки", () => {
  const special = ".*+?^${}()|[]\\";
  expect(new RegExp(`^${escapeRegExp(special)}$`).test(special)).toBe(true);
});
