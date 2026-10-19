// Только для тестов (`?faultyStep=1`): шаг 2 → 3 падает на записи с «FAIL» в названии и на правке с «FAIL»
// в заметке, как упал бы шаг с ошибкой на неожиданных данных. Исправленная сборка – та же без этого параметра.
import type { Step } from "../shared/steps.ts";
import { steps } from "../shared/steps.ts";

const boom = (value: unknown) => {
  if (typeof value === "string" && value.includes("FAIL")) throw new Error("шаг упал");
};

export const faultySteps: Record<number, Step> = {
  ...steps,
  2: {
    entity: (table, row) => (boom(row.title), steps[2]!.entity(table, row)),
    edit: (table, fields, row) => (boom(fields.note), steps[2]!.edit(table, fields, row)),
  },
};
