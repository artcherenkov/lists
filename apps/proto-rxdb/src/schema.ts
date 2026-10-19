import type { RxJsonSchema } from "rxdb/plugins/core";

import { applyStep } from "../shared/steps.ts";

export type Doc = Record<string, any>;

const text = { type: "string" } as const;
const maybe = (type: "string" | "integer") => ({ type: [type, "null"] }) as any;
const key = { type: "string", maxLength: 64 } as const;
const time = { type: "string", maxLength: 40 } as const;

// Версия схемы RxDB = версия данных - 1: подъём версии данных копирует коллекцию (так устроен RxDB).
export const itemsSchema = (dv: number): RxJsonSchema<Doc> => ({
  version: dv - 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: key,
    kind: text,
    title: text,
    year: maybe("integer"),
    tmdb_id: maybe("string"),
    poster_path: maybe("string"),
    status: text,
    rating: { type: ["integer", "null"], minimum: 1, maximum: dv >= 2 ? 5 : 10 } as any,
    watched_month: maybe("string"),
    note: maybe("string"),
    added_at: time,
    updated_at: time,
    deleted_at: maybe("string"),
    dv: { type: "integer", minimum: 1, maximum: 1000, multipleOf: 1 },
  },
  required: ["id", "kind", "title", "status", "added_at", "updated_at", "dv"],
  indexes: ["dv", "added_at"],
});

// `version` отметок меняется только в проверке стоимости копирования (identity-шаг).
export const seasonsSchema = (version = 0): RxJsonSchema<Doc> => ({
  version,
  primaryKey: "id",
  type: "object",
  properties: { id: key, item_id: key, season: { type: "integer" }, state: text, updated_at: time },
  required: ["id", "item_id", "season", "state", "updated_at"],
  indexes: ["item_id"],
});

export const showsSchema: RxJsonSchema<Doc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: key,
    title: text,
    seasons_json: text,
    continuing: { type: "boolean" },
    updated_at: time,
  },
  required: ["id", "title", "seasons_json", "updated_at"],
};

// Только на устройстве, не синхронизируются: журнал отказов и отложенные правки.
export const rejectionsSchema: RxJsonSchema<Doc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: { id: key, coll: text, doc_id: text, reason: text, at: time },
  required: ["id", "coll", "doc_id", "reason", "at"],
};
export const deferredSchema: RxJsonSchema<Doc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: { id: key, coll: text, doc_id: text, edits_json: text },
  required: ["id", "coll", "doc_id", "edits_json"],
};

// Шаги перевода как стратегии миграции RxDB. Упавший шаг не должен бросать: исключение отменило бы открытие
// всей коллекции. Запись остаётся в прежней форме со своей версией `dv` и не показывается (src/park.ts).
// Одна функция переводит и копию, и последнее известное состояние сервера, поэтому перевод не становится правкой.
export function strategies(dv: number, count?: { failed: number }) {
  const out: Record<number, (d: Doc) => Doc> = {};
  for (let to = 2; to <= dv; to++) {
    out[to - 1] = (d) => {
      if ((d.dv ?? 1) !== to - 1) return d;
      try {
        return applyStep(to, d);
      } catch {
        if (count) count.failed++;
        return d;
      }
    };
  }
  return out;
}
