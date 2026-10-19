import { EDITABLE } from "../shared/protocol.ts";
import type { Edit, Fields, Row } from "../shared/protocol.ts";

const STATUSES = ["want", "watching", "watched", "waiting"];
const CREATE_ONLY = ["year", "tmdb_id", "poster_path", "added_at"];
export const MAX_ITEMS_PER_ACCOUNT = 1000;

/** Почему правку нельзя принять, или `null`. `existing` – строка на сервере; `cur` – текущая версия данных. */
export function itemError(fields: Fields, existing: Row | undefined, cur: number): string | null {
  for (const name of Object.keys(fields)) {
    if (!EDITABLE.items.includes(name)) return `неизвестное поле ${name}`;
  }
  if (!existing && (typeof fields.kind !== "string" || typeof fields.title !== "string")) {
    return "создание без типа или названия";
  }
  if (existing) {
    for (const name of CREATE_ONLY) {
      if (name in fields && fields[name] !== existing[name]) return `поле ${name} задаётся при создании`;
    }
    if (existing.tmdb_id && ("kind" in fields || "title" in fields)) {
      if (fields.kind !== undefined && fields.kind !== existing.kind) return "тип только у ручной записи";
      if (fields.title !== undefined && fields.title !== existing.title) return "название только у ручной записи";
    }
  }
  const kind = fields.kind ?? existing?.kind;
  if ("kind" in fields && !["film", "series"].includes(fields.kind as string)) return "неверный тип";
  if ("title" in fields && (typeof fields.title !== "string" || !fields.title || fields.title.length > 200)) {
    return "неверное название";
  }
  if ("status" in fields && !STATUSES.includes(fields.status as string)) return "неверный статус";
  if (fields.status === "waiting" && kind !== "series") return "«Жду сезон» только у сериала";
  if (fields.status === undefined && existing?.status === "waiting" && fields.kind === "film") {
    return "«Жду сезон» только у сериала";
  }
  if ("rating" in fields && fields.rating !== null) {
    const max = cur >= 2 ? 5 : 10;
    if (!Number.isInteger(fields.rating) || (fields.rating as number) < 1 || (fields.rating as number) > max) {
      return "неверная оценка";
    }
  }
  if ("watched_month" in fields && fields.watched_month !== null) {
    const pattern = cur >= 3 ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{1,2}$|^$/;
    if (!pattern.test(String(fields.watched_month))) return "неверный месяц просмотра";
  }
  if ("note" in fields && typeof fields.note === "string" && fields.note.length > 2000) return "заметка длиннее 2000";
  return null;
}

/** Отметка сезона: родитель – сериал из TMDB того же человека. */
export function seasonError(fields: Fields, parent: Row | undefined): string | null {
  for (const name of Object.keys(fields)) {
    if (!EDITABLE.seasons.includes(name)) return `неизвестное поле ${name}`;
  }
  if ("state" in fields && fields.state !== null && !["watching", "watched"].includes(fields.state as string)) {
    return "неверное значение отметки";
  }
  if (!parent) return "записи нет";
  if (parent.kind !== "series" || !parent.tmdb_id) return "отметки только у сериала из TMDB";
  return null;
}

/**
 * Ворота версии данных. Младше минимальной – «нужно обновление» (426), новее сервера – «подожди» (503):
 * так бывает в секунды выкладки. `null` – версия подходит.
 */
export function versionGate(dv: number, min: number, cur: number): { status: number; body: object; headers?: Record<string, string> } | null {
  if (!(dv >= min)) return { status: 426, body: { error: "update_required", min } };
  if (dv > cur) return { status: 503, body: { error: "wait", cur }, headers: { "retry-after": "5" } };
  return null;
}

export const isEdit = (value: unknown): value is Edit => {
  const e = value as Edit;
  return (
    !!e && typeof e.key === "string" && typeof e.id === "string" && e.id.length <= 100 &&
    (e.entity === "items" || e.entity === "seasons") && typeof e.v === "number" &&
    typeof e.acct === "string" && typeof e.fields === "object" && e.fields !== null
  );
};
