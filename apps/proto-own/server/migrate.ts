import type { Entity, Row } from "../shared/protocol.ts";
import type { Step } from "../shared/steps.ts";

import { steps } from "../shared/steps.ts";
import { inTransaction, setting } from "./db.ts";

/** Колонки, которые перевод не пишет: у них своя жизнь (номер изменения ставит триггер, версия – выкладка). */
const KEPT = new Set(["id", "user_id", "seq", "dv"]);

/**
 * Выкладка, поднимающая версию данных: одна транзакция переводит все строки шагом и включает версию.
 * Блокировка номеров держит приём правок: правка старой версии не ляжет между переводом и включением.
 * Упавший шаг откатывает всё – версия не включается. Поле «изменена» шаг не трогает.
 */
export async function deployVersion(
  to: number,
  stepsToRun: Record<number, Step> = steps,
): Promise<void> {
  await inTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(1)");
    const from = Number(await setting(client, "cur_dv"));
    for (let version = from; version < to; version++) {
      const step = stepsToRun[version]!;
      for (const table of ["items", "seasons"] as Entity[]) {
        const rows = await client.query(`SELECT to_jsonb(t) AS row FROM ${table} t WHERE dv = $1`, [
          version,
        ]);
        for (const { row } of rows.rows as { row: Row }[]) {
          const next = step.entity(table, row);
          // Та же функция, что на устройстве, и к записи целиком: колонки не перечисляем.
          const changed = Object.keys(row).filter(
            (c) => !KEPT.has(c) && c in next && next[c] !== row[c],
          );
          const set = [...changed.map((c, i) => `${c} = $${i + 2}`), `dv = ${version + 1}`].join(
            ", ",
          );
          await client.query(`UPDATE ${table} SET ${set} WHERE id = $1`, [
            row.id,
            ...changed.map((c) => next[c]),
          ]);
        }
      }
    }
    await client.query("UPDATE settings SET value = $1 WHERE key IN ('cur_dv', 'min_dv')", [
      String(to),
    ]);
  });
}
