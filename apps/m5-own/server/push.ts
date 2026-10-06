import type { Edit, EditResult, Entity, PushResponse, Row } from "../shared/protocol.ts";
import type pg from "pg";

import { itemIdOfSeason } from "../shared/protocol.ts";
import { inTransaction, setting } from "./db.ts";
import { isEdit, itemError, MAX_ITEMS_PER_ACCOUNT, seasonError, versionGate } from "./rules.ts";

/** Только для тестов: правка этой записи роняет сервер, как непредвиденная ошибка в обработчике. */
export const faults = { poisonedId: null as string | null };

const PUBLIC = `- 'user_id' - 'seq'`;

/** Строка, как она на сервере, – но только своя: чужой идентификатор ответом не выдаём. */
export async function ownRow(
  client: pg.Pool | pg.PoolClient,
  entity: Entity,
  id: string,
  user: string,
): Promise<Row | null> {
  const r = await client.query(
    `SELECT to_jsonb(t) ${PUBLIC} AS row FROM ${entity} t WHERE id = $1 AND user_id = $2`,
    [id, user],
  );
  return r.rows[0]?.row ?? null;
}

/**
 * Применить правки владельца `user` по порядку одной транзакцией. Блокировка, общая с номером
 * изменения, нужна и здесь: чтение строки и запись под ней не расходятся с чужой правкой.
 * Правка, применённая раньше (тот же ключ), повторно не применяется – ответ тот же.
 * На непредвиденной ошибке остальные правки не трогаем: порядок правок одной записи важен.
 *
 * Версию и эпоху сервера читаем только после блокировки: выкладка и восстановление базы держат её,
 * поэтому правка не ляжет в базу в форме, которую перевод уже прошёл, и в базу не той эпохи.
 * `dv` – версия данных клиента, `epoch` – эпоха, которую он помнит (пусто, пока загрузки не было).
 */
export async function push(
  user: string,
  dv: number,
  epoch: unknown,
  rawEdits: unknown[],
): Promise<PushResponse | { gate: NonNullable<ReturnType<typeof versionGate>> }> {
  return inTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(1)");
    const cur = Number(await setting(client, "cur_dv"));
    const gate = versionGate(dv, Number(await setting(client, "min_dv")), cur);
    if (gate) return { gate };
    const serverEpoch = await setting(client, "epoch");
    if (epoch && epoch !== serverEpoch) return { results: [], reset: true, epoch: serverEpoch };
    const results: EditResult[] = [];
    for (const raw of rawEdits) {
      if (!isEdit(raw)) {
        results.push({
          key: String((raw as Edit)?.key),
          status: "rejected",
          error: "неверная форма правки",
        });
        continue;
      }
      const earlier = await client.query(
        "SELECT status, error FROM applied_edits WHERE key = $1 AND user_id = $2",
        [raw.key, user],
      );
      if (earlier.rows[0]) {
        results.push({
          key: raw.key,
          ...earlier.rows[0],
          row: await ownRow(client, raw.entity, raw.id, user),
        });
        continue;
      }
      await client.query("SAVEPOINT edit");
      try {
        const error = await applyEdit(client, user, cur, raw);
        if (error) await client.query("ROLLBACK TO edit");
        const status = error ? "rejected" : "ok";
        await client.query(
          "INSERT INTO applied_edits (key, user_id, status, error) VALUES ($1, $2, $3, $4)",
          [raw.key, user, status, error],
        );
        results.push({
          key: raw.key,
          status,
          error: error ?? undefined,
          row: await ownRow(client, raw.entity, raw.id, user),
        });
      } catch (e) {
        await client.query("ROLLBACK TO edit");
        results.push({
          key: raw.key,
          status: "failed",
          error: String((e as Error).message),
          row: await ownRow(client, raw.entity, raw.id, user),
        });
        break;
      }
    }
    return { results };
  });
}

/** `null` – правка применена, иначе причина отказа (записи не изменены). */
async function applyEdit(
  client: pg.PoolClient,
  user: string,
  cur: number,
  edit: Edit,
): Promise<string | null> {
  if (faults.poisonedId === edit.id) throw new Error("сбой обработчика (тест)");
  if (edit.acct !== user) return "правка сделана другим аккаунтом";
  if (edit.v !== cur) return `версия правки ${edit.v}, версия сервера ${cur}`;

  const found = await client.query(
    `SELECT to_jsonb(t) AS row, user_id FROM ${edit.entity} t WHERE id = $1`,
    [edit.id],
  );
  if (found.rows[0] && found.rows[0].user_id !== user)
    return "идентификатор принадлежит другому аккаунту";
  const existing: Row | undefined = found.rows[0]?.row;

  let extra: Record<string, unknown> = {};
  let error: string | null;
  if (edit.entity === "items") {
    error = itemError(edit.fields, existing, cur);
    if (!error && !existing) {
      const count = await client.query("SELECT count(*)::int AS n FROM items WHERE user_id = $1", [
        user,
      ]);
      if (count.rows[0].n >= MAX_ITEMS_PER_ACCOUNT) error = "слишком много записей";
    }
  } else {
    const itemId = itemIdOfSeason(edit.id);
    const parent = await client.query(
      "SELECT to_jsonb(t) AS row FROM items t WHERE id = $1 AND user_id = $2",
      [itemId, user],
    );
    error = seasonError(edit.fields, parent.rows[0]?.row);
    extra = { item_id: itemId, season: Number(edit.id.slice(itemId.length + 1)) };
    if (!error && !Number.isInteger(extra.season)) error = "неверный номер сезона";
  }
  if (error) return error;

  const values = { ...edit.fields, ...(existing ? {} : { user_id: user, ...extra }), dv: cur };
  const columns = Object.keys(values);
  const params = Object.values(values);
  if (existing) {
    const set = columns.map((c, i) => `${c} = $${i + 2}`).join(", ");
    await client.query(`UPDATE ${edit.entity} SET ${set} WHERE id = $1`, [edit.id, ...params]);
  } else {
    const names = ["id", ...columns].join(", ");
    const marks = ["id", ...columns].map((_, i) => `$${i + 1}`).join(", ");
    await client.query(`INSERT INTO ${edit.entity} (${names}) VALUES (${marks})`, [
      edit.id,
      ...params,
    ]);
  }
  return null;
}
