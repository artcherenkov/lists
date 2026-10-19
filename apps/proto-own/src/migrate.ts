import type { Entity } from "../shared/protocol.ts";
import type { Step } from "../shared/steps.ts";

import { steps } from "../shared/steps.ts";
import { DATA_VERSION } from "./config.ts";
import { db, getMeta, setMeta } from "./db.ts";
import { itemIdOf } from "./store.ts";

/**
 * Перевод копии и очереди до версии этой сборки, шаг за шагом: на каждом шаге в одной транзакции
 * сначала вся копия, потом вся очередь по порядку. У строки и у правки своя версия, поэтому
 * прерванный перевод продолжается с места остановки.
 *
 * Версия окна записывается первой: окно старой версии рядом перестаёт писать в копию.
 * Возвращает `false`, если копия уже новее этого окна.
 */
export async function migrateCopy(stepsToRun: Record<number, Step> = steps): Promise<boolean> {
  return navigator.locks.request("migrate", async () => {
    const stored = (await getMeta<number>("dv")) ?? 0;
    if (stored > DATA_VERSION) return false;
    if (stored < DATA_VERSION) await setMeta("dv", DATA_VERSION);
    for (let from = 1; from < DATA_VERSION; from++) await migrateStep(from, stepsToRun[from]!);
    return true;
  });
}

/**
 * Что не удалось перевести, остаётся в версии `from`, пока не выйдет исправленная сборка:
 * строка скрыта, а правки той записи и её отметок ждут вместе с более поздними.
 */
async function migrateStep(from: number, step: Step): Promise<void> {
  await db.transaction("rw", [db.items, db.seasons, db.queue], async () => {
    const stuckItems = new Set<string>();
    for (const entity of ["items", "seasons"] as Entity[]) {
      for (const row of await db[entity].where("dv").equals(from).toArray()) {
        try {
          await db[entity].put({ ...step.entity(entity, row), dv: from + 1 } as typeof row);
        } catch {
          stuckItems.add(itemIdOf(entity, row.id));
        }
      }
    }
    for (const edit of await db.queue.where("v").equals(from).sortBy("n")) {
      const itemId = itemIdOf(edit.entity, edit.id);
      if (stuckItems.has(itemId)) continue;
      try {
        const row = await db[edit.entity].get(edit.id);
        const fields = step.edit(edit.entity, edit.fields, row);
        // Если шаг убрал все тронутые поля, правка пустая и не уходит.
        if (Object.keys(fields).length === 0) await db.queue.delete(edit.n!);
        else await db.queue.put({ ...edit, fields, v: from + 1 });
      } catch {
        stuckItems.add(itemId);
      }
    }
  });
}

/** Сколько записей ждут исправленной сборки: список говорит об этом, пока они скрыты. */
export const stuckCount = () => db.items.where("dv").below(DATA_VERSION).count();
