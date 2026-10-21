import { describe, expect, test } from "vitest";

import { findUnsafeAdditions } from "../unsafe-additions.ts";

const emptyPlan = { toBeCreated: [], toBeAdded: [], toBeAddedIndexes: [] };

describe("добавки better-auth к существующим таблицам", () => {
  test("необязательная колонка и колонка с умолчанием – можно", () => {
    const plan = {
      ...emptyPlan,
      toBeAdded: [
        {
          table: "user",
          order: 1,
          fields: {
            telegramUsername: { type: "string" as const, required: false },
            locale: { type: "string" as const, defaultValue: "ru" },
            seenAt: { type: "date" as const, defaultValue: () => new Date() },
          },
        },
      ],
    };

    expect(findUnsafeAdditions(plan)).toEqual([]);
  });

  test("NOT NULL без умолчания, уникальность и ссылка – нельзя", () => {
    const plan = {
      ...emptyPlan,
      toBeAdded: [
        {
          table: "user",
          order: 1,
          fields: {
            nickname: { type: "string" as const },
            code: { type: "string" as const, required: false, unique: true },
            teamId: {
              type: "string" as const,
              required: false,
              references: { model: "team", field: "id" },
            },
          },
        },
      ],
    };

    expect(findUnsafeAdditions(plan)).toEqual([
      "user.nickname: колонка NOT NULL без умолчания",
      "user.code: уникальная колонка",
      "user.teamId: ссылка на team",
    ]);
  });

  test("уникальный индекс – нельзя на существующей таблице, можно на новой", () => {
    const index = {
      name: "uidx",
      columns: ["providerId", "accountId"] as [string, string],
      unique: true,
    };
    const plan = {
      ...emptyPlan,
      toBeCreated: [{ table: "codes", fields: {}, order: 1 }],
      toBeAddedIndexes: [
        { table: "account", index, name: "account_uidx" },
        { table: "codes", index, name: "codes_uidx" },
      ],
    };

    expect(findUnsafeAdditions(plan)).toEqual(["account: уникальный индекс account_uidx"]);
  });
});
