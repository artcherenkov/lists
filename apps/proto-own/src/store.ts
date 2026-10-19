import type { Entity, Fields, Row } from "../shared/protocol.ts";
import type { LocalRow } from "./db.ts";

import { itemIdOfSeason, seasonId } from "../shared/protocol.ts";
import { DATA_VERSION, USER } from "./config.ts";
import { db, getMeta } from "./db.ts";

export class UpdateRequired extends Error {
  constructor() {
    super("Копия на устройстве новее этого окна: нужно обновление");
  }
}

/** Вызывается внутри транзакции: окно старой версии не пишет в копию, которую перевело новое. */
export async function assertCopyNotNewer(): Promise<void> {
  if (((await getMeta<number>("dv")) ?? 0) > DATA_VERSION) throw new UpdateRequired();
}

const now = () => new Date().toISOString();
export const itemIdOf = (entity: Entity, id: string) =>
  entity === "items" ? id : itemIdOfSeason(id);

/**
 * Правка человека: строка копии и правка в очереди пишутся одной транзакцией. Правка несёт только
 * изменённые поля и время «изменена»; `localOnly` – то, что нужно только строке копии.
 */
async function edit(
  entity: Entity,
  id: string,
  fields: Fields,
  localOnly: Fields = {},
): Promise<void> {
  await db.transaction("rw", [db.items, db.seasons, db.queue, db.meta], async () => {
    await assertCopyNotNewer();
    const current = await db[entity].get(id);
    // Форма, сохраняющая строку целиком, шлёт только то, что изменилось.
    const touched = current
      ? Object.entries(fields).filter(([name, value]) => current[name] !== value)
      : Object.entries(fields);
    if (current && touched.length === 0) return;
    const stamped = { ...Object.fromEntries(touched), updated_at: now() };
    await db[entity].put({
      ...localOnly,
      ...current,
      ...stamped,
      id,
      dv: DATA_VERSION,
    } as LocalRow);
    await db.queue.add({
      key: crypto.randomUUID(),
      entity,
      id,
      fields: stamped,
      v: DATA_VERSION,
      acct: USER,
      attempts: 0,
    });
  });
}

export async function createItem(input: {
  kind: string;
  title: string;
  tmdb_id?: string;
  year?: number;
  rating?: number;
}): Promise<string> {
  const id = crypto.randomUUID();
  await edit("items", id, { status: "want", added_at: now(), deleted_at: null, ...input });
  return id;
}

export const editItem = (id: string, fields: Fields) => edit("items", id, fields);
export const deleteItem = (id: string) => edit("items", id, { deleted_at: now() });
export const restoreItem = (id: string) => edit("items", id, { deleted_at: null });

/** Отметка сезона; `null` снимает её. */
export const markSeason = (itemId: string, season: number, state: "watching" | "watched" | null) =>
  edit("seasons", seasonId(itemId, season), { state }, { item_id: itemId, season });

/**
 * Принять строку сервера (с загрузки, из ответа на правку или перезагрузкой одной записи).
 * Неотправленные правки этой строки накладываются поверх: загрузка очередь не стирает.
 * Вызывать внутри транзакции с `items`, `seasons` и `queue`.
 */
export async function applyServerRow(entity: Entity, row: Row & { dv: number }): Promise<void> {
  const pending = await db.queue.where("[entity+id]").equals([entity, row.id]).toArray();
  const merged: LocalRow = { ...row, server: true };
  for (const e of pending) if (e.v === row.dv) Object.assign(merged, e.fields);
  await db[entity].put(merged);
}
