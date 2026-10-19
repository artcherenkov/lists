import Dexie from "dexie";
import type { Table } from "dexie";
import type { Edit, Entity, Fields, Row } from "../shared/protocol.ts";
import { USER } from "./config.ts";

/** Строка копии. `dv` – версия данных, в которой она лежит; `server` – сервер эту строку знает. */
export type LocalRow = Row & { dv: number; server?: boolean };
export interface QueuedEdit extends Edit {
  n?: number;
  attempts: number;
}
export interface Rejection {
  n?: number;
  at: string;
  entity: Entity;
  id: string;
  fields: Fields;
  error: string;
}

class ListsDb extends Dexie {
  items!: Table<LocalRow, string>;
  seasons!: Table<LocalRow, string>;
  shows!: Table<Row, string>;
  queue!: Table<QueuedEdit, number>;
  meta!: Table<{ key: string; value: unknown }, string>;
  rejections!: Table<Rejection, number>;

  constructor() {
    // Своя база у каждого аккаунта: правки одного не попадут в сессию другого.
    super(`lists-${USER}`);
    this.version(1).stores({
      items: "id, dv",
      seasons: "id, dv",
      shows: "id",
      queue: "++n, v, [entity+id]",
      meta: "key",
      rejections: "++n",
    });
  }
}

export const db = new ListsDb();

export const getMeta = async <T>(key: string): Promise<T | undefined> => (await db.meta.get(key))?.value as T | undefined;
export const setMeta = (key: string, value: unknown) => db.meta.put({ key, value });
