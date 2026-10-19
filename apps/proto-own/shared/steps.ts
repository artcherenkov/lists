import type { Entity, Fields, Row } from "./protocol.ts";

/**
 * Шаг перевода версии данных `from` → `from + 1`: чистые функции, общие для сервера и устройства.
 * `edit` получает сущность в форме своей версии – со всеми правками очереди – или `undefined`.
 */
export interface Step {
  entity(table: Entity, row: Row): Row;
  edit(table: Entity, fields: Fields, row: Row | undefined): Fields;
}


const toStars = (rating: unknown) => (rating == null ? null : Math.floor(((rating as number) + 1) / 2));

/** «2024-5» становится «2024-05». Значения другого вида шаг не знает. */
export function padMonth(value: unknown): unknown {
  if (value == null) return null;
  const m = /^(\d{4})-(\d{1,2})$/.exec(String(value));
  if (!m) throw new Error(`watched_month не год-месяц: ${JSON.stringify(value)}`);
  return `${m[1]}-${m[2]!.padStart(2, "0")}`;
}

const mapField = (fields: Fields, name: string, convert: (v: unknown) => unknown): Fields =>
  name in fields ? { ...fields, [name]: convert(fields[name]) } : fields;

export const steps: Record<number, Step> = {
  // Оценка 1–10 становится звёздами 1–5.
  1: {
    entity: (table, row) => (table === "items" ? (mapField(row, "rating", toStars) as Row) : row),
    edit: (table, fields) => (table === "items" ? mapField(fields, "rating", toStars) : fields),
  },
  // Месяц просмотра – всегда две цифры.
  2: {
    entity: (table, row) => (table === "items" ? (mapField(row, "watched_month", padMonth) as Row) : row),
    edit: (table, fields) => (table === "items" ? mapField(fields, "watched_month", padMonth) : fields),
  },
};
