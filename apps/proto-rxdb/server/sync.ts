import { createHash } from "node:crypto";
import pg from "pg";
import { checkItem, checkSeason, ITEM_FIELDS, SEASON_FIELDS } from "./rules.ts";

type Doc = Record<string, any>;
export type Collection = "items" | "seasons" | "shows";
export type PushRow = { assumedMasterState?: Doc; newDocumentState: Doc };
export type PushResult = { conflicts: Doc[]; rejected: { id: string; reason: string }[]; later: string[] };

export const pool = new pg.Pool({ host: "127.0.0.1", port: 15434, user: "postgres", password: "postgres", database: "app", max: 8 });

// Крючки для проверок: в продуктовом пути ничего не делают.
export const hooks = {
  beforeApply: (_id: string) => {},
  onApply: (_e: { coll: string; id: string; dv: number; creating: boolean; fields: string[] }) => {},
  loseResponse: () => false,
};

const TABLES = {
  items: { fields: ITEM_FIELDS, tomb: null },
  seasons: { fields: SEASON_FIELDS, tomb: "deleted" },
} as const;

export async function settings() {
  const r = await pool.query("SELECT key, value FROM settings");
  return Object.fromEntries(r.rows.map((x) => [x.key, x.value])) as Record<string, string>;
}

const same = (x: unknown, y: unknown) => (x ?? null) === (y ?? null);

function toDoc(coll: Collection, r: Doc): Doc {
  if (coll === "shows") return { id: r.id, title: r.title, seasons_json: r.seasons_json, continuing: r.continuing, updated_at: r.updated_at, _deleted: !!r.gone };
  const t = TABLES[coll];
  const d: Doc = { id: r.id };
  for (const f of t.fields) d[f] = r[f];
  if (coll === "items") d.dv = r.dv;
  d._deleted = t.tomb ? r[t.tomb] : false;
  return d;
}

// Выдача изменений по номеру. Контрольная точка – {seq, epoch}: при другой эпохе (база восстановлена
// из копии) читаем с начала, иначе устройство с номером из «будущего» не получило бы ничего.
export async function pull(coll: Collection, user: string, cp: { seq?: number; epoch?: string }, limit: number) {
  const s = await settings();
  const seq = cp.epoch === s.epoch ? (cp.seq ?? 0) : 0;
  // Сериал каталога – тем, у кого он есть в списке; `gone` – ушёл из списка, устройство его удаляет.
  const sql =
    coll === "shows"
      ? `SELECT s.*, NOT EXISTS (SELECT 1 FROM items i WHERE i.user_id = $1 AND i.kind = 'series' AND i.tmdb_id = s.id AND i.deleted_at IS NULL) AS gone
         FROM shows s WHERE s.seq > $2 AND EXISTS (SELECT 1 FROM items i WHERE i.user_id = $1 AND i.kind = 'series' AND i.tmdb_id = s.id)
         ORDER BY s.seq LIMIT $3`
      : `SELECT * FROM ${coll} WHERE user_id = $1 AND seq > $2 ORDER BY seq LIMIT $3`;
  const { rows } = await pool.query(sql, [user, seq, limit]);
  return { documents: rows.map((r) => toDoc(coll, r)), checkpoint: { seq: rows.length ? Number(rows[rows.length - 1].seq) : seq, epoch: s.epoch } };
}

export async function docState(coll: "items" | "seasons", user: string, id: string): Promise<Doc> {
  const { rows } = await pool.query(`SELECT * FROM ${coll} WHERE id = $1 AND user_id = $2`, [id, user]);
  return rows[0] ? toDoc(coll, rows[0]) : { id, _deleted: true };
}

// Приём правок пачкой, одной транзакцией. Блокировка берётся первой: записи идут по одной, и порядок
// номеров совпадает с порядком коммитов (триггер bump_seq).
export async function push(coll: "items" | "seasons", user: string, dv: number, rows: PushRow[]): Promise<PushResult> {
  const c = await pool.connect();
  const out: PushResult = { conflicts: [], rejected: [], later: [] };
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(1)");
    await c.query("DELETE FROM applied_pushes WHERE at < now() - interval '1 day'");
    for (const row of rows) await applyRow(c, coll, user, dv, row, out);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

async function applyRow(c: pg.PoolClient, coll: "items" | "seasons", user: string, dv: number, row: PushRow, out: PushResult) {
  const t = TABLES[coll];
  const n = row.newDocumentState;
  const a = row.assumedMasterState;
  const id: string = n.id;
  hooks.beforeApply(id);

  const cur = (await c.query(`SELECT * FROM ${coll} WHERE id = $1`, [id])).rows[0];
  const mine = cur?.user_id === user ? cur : undefined;
  // Отказ отвечает состоянием сервера: правка откатывается, отклонённое создание удаляется надгробием.
  const refuse = (reason: string) => {
    out.rejected.push({ id, reason });
    out.conflicts.push(mine ? toDoc(coll, mine) : { ...n, _deleted: true });
  };
  const answer = (r: Doc | undefined) => {
    const doc = r && toDoc(coll, r);
    if (doc && Object.keys(doc).some((k) => (k === "_deleted" ? !!doc[k] !== !!n[k] : !same(doc[k], n[k])))) out.conflicts.push(doc);
  };

  if (cur && !mine) return refuse("not yours");
  const bad = Object.keys(n).find((k) => !["id", "_deleted", "dv", ...t.fields].includes(k));
  if (bad) return refuse(`unknown field ${bad}`);

  // Повтор той же правки (ответ потерялся) не накладывается второй раз: иначе он затёр бы более позднюю правку другого устройства.
  const key = createHash("sha1").update(JSON.stringify([user, coll, a ?? null, n])).digest("hex");
  if ((await c.query("SELECT 1 FROM applied_pushes WHERE key = $1", [key])).rowCount) return answer(mine);

  const creating = !mine;
  const changed = t.fields.filter((f) => !same(n[f], a?.[f]));
  const merged = creating ? n : { ...mine, ...Object.fromEntries(changed.map((f) => [f, n[f]])) };
  const deleting = !!n._deleted;

  if (coll === "items") {
    if (deleting) return refuse("items are soft-deleted");
    const err = checkItem(merged, changed, creating, dv);
    if (err) return refuse(err);
  } else if (!deleting) {
    const err = checkSeason(merged);
    if (err) return refuse(err);
    const item = (await c.query("SELECT kind FROM items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL", [merged.item_id, user])).rows[0];
    if (!item) return void out.later.push(id); // отметка пришла раньше своей записи: коллекции идут независимо
    if (item.kind !== "series") return refuse("marks only for series");
  }

  // Что писать. Правка – только изменённые поля; отметка, правленная после удаления на другом устройстве, возвращается.
  const v: Doc = creating ? { id, user_id: user, ...(coll === "items" ? { dv } : {}), ...Object.fromEntries(t.fields.filter((f) => n[f] !== undefined).map((f) => [f, n[f]])) } : Object.fromEntries(changed.map((f) => [f, n[f]]));
  if (t.tomb) {
    if (deleting && creating) return;
    if (deleting || changed.length || creating) v[t.tomb] = deleting;
  }
  const names = Object.keys(v);
  if (names.length) {
    await c.query(
      creating
        ? `INSERT INTO ${coll} (${names.join(",")}) VALUES (${names.map((_, i) => `$${i + 1}`).join(",")})`
        : `UPDATE ${coll} SET ${names.map((k, i) => `${k} = $${i + 2}`).join(",")} WHERE id = $1`,
      creating ? names.map((k) => v[k]) : [id, ...names.map((k) => v[k])],
    );
    hooks.onApply({ coll, id, dv, creating, fields: names.filter((k) => k !== "id" && k !== "user_id") });
  }
  const after = (await c.query(`SELECT * FROM ${coll} WHERE id = $1`, [id])).rows[0];
  // Сериал каталога поднимается, когда запись появилась или ушла: иначе номер строки каталога старше контрольной точки
  // устройства и сериал не приедет (и не уйдёт).
  if (coll === "items" && after.kind === "series" && after.tmdb_id && (creating || changed.includes("deleted_at"))) {
    await c.query(
      `INSERT INTO shows (id, title, seasons_json, updated_at) VALUES ($1, $2, '[]', $3)
       ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id`,
      [after.tmdb_id, after.title, after.updated_at],
    );
  }
  await c.query("INSERT INTO applied_pushes (key) VALUES ($1) ON CONFLICT DO NOTHING", [key]);
  answer(after);
}
