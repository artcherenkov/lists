export type Entity = "items" | "seasons";
export type Fields = Record<string, unknown>;
export type Row = Fields & { id: string };

/** Что человек может править у записи и у отметки; остальное ставит сервер или создатель. */
export const EDITABLE: Record<Entity, readonly string[]> = {
  items: [
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
  ],
  seasons: ["state", "updated_at"],
};

/** Правка: только тронутые поля. `key` – ключ повтора, `v` – версия данных, в которой правку сделали. */
export interface Edit {
  key: string;
  entity: Entity;
  id: string;
  fields: Fields;
  v: number;
  acct: string;
}

export interface EditResult {
  key: string;
  status: "ok" | "rejected" | "failed";
  error?: string;
  /** Строка на сервере после правки; у отказа – какой она осталась. */
  row?: Row | null;
}

export interface PushResponse {
  /** Правки после первого `failed` сервер не трогает, и результатов у них нет. */
  results: EditResult[];
  /** Эпоха устройства не совпала с эпохой сервера: базу восстановили из копии. Правки не применялись. */
  reset?: boolean;
  epoch?: string;
}

export interface PullResponse {
  epoch: string;
  /** Контрольная точка клиента относится к другой базе: базу восстановили из копии. Данных в ответе нет. */
  reset: boolean;
  cp: number;
  more: boolean;
  items: Row[];
  seasons: Row[];
  shows: Row[];
  /** Сериалы, которые ушли из каталога человека. */
  goneShows: string[];
}

export const seasonId = (itemId: string, season: number) => `${itemId}:${season}`;
export const itemIdOfSeason = (id: string) => id.slice(0, id.lastIndexOf(":"));
