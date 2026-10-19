import { replicateRxCollection } from "rxdb/plugins/replication";
import type { RxCollection } from "rxdb/plugins/core";
import { lift } from "../shared/steps.ts";
import { Api, ServerError } from "./api.ts";
import type { Doc } from "./schema.ts";

type Row = { assumedMasterState?: Doc; newDocumentState: Doc };
type Result = { conflicts: Doc[]; rejected: { id: string; reason: string }[]; later: string[] };

export type Cols = { items: RxCollection<Doc>; seasons: RxCollection<Doc>; shows: RxCollection<Doc>; rejections: RxCollection<Doc>; deferred: RxCollection<Doc> };

export const stats = { later: 0 };
const rid = () => crypto.randomUUID();
const stripMeta = (d: Doc) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== "_meta" && k !== "_rev" && k !== "_attachments"));

export function createSync(api: Api, cols: Cols, cfg: { dv: number; retry: number; limit: number }) {
  const tries = new Map<string, number>();

  const serverState = async (coll: string, n: Doc) => {
    const s = await api.get(`/doc/${coll}/${encodeURIComponent(n.id)}`);
    return "title" in s || "item_id" in s ? s : { ...n, _deleted: true };
  };

  // Решение 21: правка записи, которую не удалось перевести, и более поздние правки её и её отметок ждут исправления.
  const replaying = new Set<string>();
  const waits = async (key: string) => !replaying.has(key) && !!(await cols.deferred.findOne(key).exec());
  const stuck = async (coll: "items" | "seasons", n: Doc) => {
    if (await waits(`${coll}:${n.id}`)) return true;
    if (coll === "items") return (n.dv ?? cfg.dv) < cfg.dv;
    const itemId = n.item_id ?? String(n.id).split(":")[0];
    if (await waits(`items:${itemId}`)) return true;
    const it = await cols.items.findOne(itemId).exec();
    return !!it && it.dv < cfg.dv;
  };

  const park = async (coll: string, r: Row) => {
    const key = `${coll}:${r.newDocumentState.id}`;
    const cur = await cols.deferred.findOne(key).exec();
    const edits = cur ? JSON.parse(cur.edits_json) : [];
    edits.push({ base: r.assumedMasterState ?? null, local: r.newDocumentState });
    await cols.deferred.upsert({ id: key, coll, doc_id: r.newDocumentState.id, edits_json: JSON.stringify(edits) });
  };

  const give = async (coll: string, r: Row, reason: string): Promise<Doc> => {
    await cols.rejections.insert({ id: rid(), coll, doc_id: r.newDocumentState.id, reason, at: new Date().toISOString() });
    return r.assumedMasterState ? stripMeta(r.assumedMasterState) : { ...r.newDocumentState, _deleted: true };
  };

  // Предел повторов: правка, на которую сервер отвечает ошибкой, не блокирует очередь вечно. Счётчик – в памяти.
  const send = async (coll: string, rows: Row[]): Promise<Result> => {
    try {
      const res: Result = await api.post(`/push/${coll}`, { rows });
      for (const r of rows) tries.delete(`${coll}:${r.newDocumentState.id}`);
      return res;
    } catch (e) {
      if (!(e instanceof ServerError) || e.status < 500 || e.status === 503) throw e;
      if (rows.length > 1) {
        const out: Result = { conflicts: [], rejected: [], later: [] };
        let failure: unknown;
        for (const r of rows) {
          try {
            const x = await send(coll, [r]);
            out.conflicts.push(...x.conflicts); out.rejected.push(...x.rejected); out.later.push(...x.later);
          } catch (e2) {
            failure = e2;
          }
        }
        if (failure) throw failure;
        return out;
      }
      const key = `${coll}:${rows[0]!.newDocumentState.id}`;
      const n = (tries.get(key) ?? 0) + 1;
      tries.set(key, n);
      if (n < cfg.limit) throw e;
      tries.delete(key);
      return { conflicts: [await give(coll, rows[0]!, `gave up after ${n} attempts: ${e.status}`)], rejected: [], later: [] };
    }
  };

  const pushRows = (coll: "items" | "seasons") => async (rows: Row[]): Promise<any[]> => {
    const conflicts: Doc[] = [];
    const go: Row[] = [];
    let parked = false;
    for (const r of rows) {
      if (await stuck(coll, r.newDocumentState)) {
        // Сначала ответ сервера: без сети обработчик падает до того, как правка записана, и повтор не задвоит её.
        const state = await serverState(coll, r.newDocumentState);
        await park(coll, r);
        conflicts.push(state);
        parked = true;
      } else go.push({ assumedMasterState: r.assumedMasterState && stripMeta(r.assumedMasterState), newDocumentState: stripMeta(r.newDocumentState) });
    }
    if (go.length) {
      const res = await send(coll, go);
      for (const x of res.rejected) await cols.rejections.insert({ id: rid(), coll, doc_id: x.id, reason: x.reason, at: new Date().toISOString() });
      conflicts.push(...res.conflicts);
      // Отметка пришла раньше своей записи (коллекции идут независимо): ждём, пока уйдёт очередь записей, и шлём отметку ещё раз.
      if (res.later.length) {
        stats.later += res.later.length;
        await Promise.race([reps[0]!.awaitInSync(), new Promise((ok) => setTimeout(ok, cfg.retry * 2))]);
        const again = await send(coll, go.filter((r) => res.later.includes(r.newDocumentState.id)));
        for (const x of again.rejected) await cols.rejections.insert({ id: rid(), coll, doc_id: x.id, reason: x.reason, at: new Date().toISOString() });
        conflicts.push(...again.conflicts);
        if (again.later.length) throw new Error("later");
      }
    }
    // Исправленная версия применяет ждущие правки сразу, упавшая оставляет их.
    if (parked) setTimeout(() => void replayDeferred(), 200);
    return conflicts;
  };

  // База сервера восстановлена из копии (другая эпоха): записи, которых после восстановления нет на сервере, отправляем заново.
  const reconcile = async () => {
    for (const coll of ["items", "seasons"] as const) {
      const have = new Set<string>((await api.get(`/ids/${coll}`)).ids);
      for (const d of await cols[coll].find().exec()) if (!have.has(d.primary)) await d.incrementalPatch({ updated_at: new Date().toISOString() });
    }
  };

  const pullRows = (coll: string) => async (cp: { seq?: number; epoch?: string } | undefined, limit: number) => {
    const q = new URLSearchParams({ seq: String(cp?.seq ?? 0), limit: String(limit) });
    if (cp?.epoch) q.set("epoch", cp.epoch);
    const res = await api.get(`/pull/${coll}?${q}`);
    if (cp?.epoch && res.checkpoint.epoch !== cp.epoch && coll === "items") setTimeout(() => void reconcile().catch(() => {}), 1500);
    return res;
  };

  const reps = (["items", "seasons", "shows"] as const).map((coll) =>
    replicateRxCollection<Doc, any>({
      collection: cols[coll],
      replicationIdentifier: `${coll}-${api.user}`,
      live: true,
      retryTime: cfg.retry,
      pull: { batchSize: 200, handler: pullRows(coll), stream$: api.resync$ },
      ...(coll === "shows" ? {} : { push: { batchSize: 50, handler: pushRows(coll) } }),
    }),
  );
  api.onUpdateRequired = () => reps.forEach((r) => void r.pause());

  // После исправления перевода: правки из «ждущих» применяются к текущей копии как обычные, считая только тронутые поля.
  let replayRunning = false;
  const replayDeferred = async () => {
    if (replayRunning) return;
    replayRunning = true;
    const all = await cols.deferred.find().exec();
    all.forEach((d) => replaying.add(d.id));
    for (const d of all) {
      const edits: { base: Doc | null; local: Doc }[] = JSON.parse(d.edits_json);
      try {
        const lifted = edits.map((e) => ({ base: e.base && lift(e.base, cfg.dv), local: d.coll === "items" ? lift(e.local, cfg.dv) : e.local }));
        const col = cols[d.coll as "items" | "seasons"];
        for (const { base, local } of lifted) {
          const doc = await col.findOne(d.doc_id).exec();
          if (d.coll === "items" && doc && doc.dv < cfg.dv) throw new Error("copy not translated yet");
          const body = stripMeta(local);
          if (local._deleted) await doc?.remove();
          else if (!base || !doc) await col.upsert(body);
          else {
            const patch = Object.fromEntries(Object.keys(body).filter((k) => JSON.stringify(body[k]) !== JSON.stringify(base[k])).map((k) => [k, body[k]]));
            await doc.incrementalPatch(patch);
          }
        }
        await d.remove();
      } catch {}
    }
    replaying.clear();
    replayRunning = false;
  };

  return { reps, replayDeferred };
}
