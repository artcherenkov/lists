// Правила данных: что принимает сервер. Клиентским кодом не дублируются – клиент получает отказ.
type Doc = Record<string, any>;

export const ITEM_FIELDS = [
  "kind",
  "title",
  "year",
  "tmdb_id",
  "poster_path",
  "status",
  "rating",
  "watched_month",
  "note",
  "added_at",
  "updated_at",
  "deleted_at",
];
export const SEASON_FIELDS = ["item_id", "season", "state", "updated_at"];
const CREATE_ONLY = ["year", "tmdb_id", "poster_path", "added_at"];
const STATUSES = ["want", "watching", "watched", "waiting"];

/** `m` – запись целиком после слияния, `changed` – поля, которые правка трогает. */
export function checkItem(m: Doc, changed: string[], creating: boolean, dv: number): string | null {
  if (!(dv >= 3 ? ["movie", "series"] : ["film", "series"]).includes(m.kind)) return "bad kind";
  if (typeof m.title !== "string" || !m.title || m.title.length > 200) return "bad title";
  if (!STATUSES.includes(m.status)) return "bad status";
  if (m.status === "waiting" && m.kind !== "series") return "waiting only for series";
  if (
    m.rating != null &&
    !(Number.isInteger(m.rating) && m.rating >= 1 && m.rating <= (dv >= 2 ? 5 : 10))
  )
    return "bad rating";
  if (m.watched_month != null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(m.watched_month))
    return "bad month";
  if (m.note != null && (typeof m.note !== "string" || m.note.length > 2000))
    return "note too long";
  if (typeof m.added_at !== "string" || typeof m.updated_at !== "string") return "bad time";
  if (!creating) {
    const bad = changed.find((k) => CREATE_ONLY.includes(k));
    if (bad) return `field ${bad} is create-only`;
    if (m.tmdb_id && changed.some((k) => k === "kind" || k === "title"))
      return "kind and title are editable only for manual items";
  }
  return null;
}

export function checkSeason(m: Doc): string | null {
  if (!["watching", "watched"].includes(m.state)) return "bad state";
  if (!Number.isInteger(m.season) || m.season < 1 || m.id !== `${m.item_id}:${m.season}`)
    return "bad season id";
  return null;
}
