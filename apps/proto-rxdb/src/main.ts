import { getAssumedMasterState } from "rxdb/plugins/core";
import { faults } from "../shared/steps.ts";
import { openApp } from "./db.ts";
import { stats } from "./sync.ts";
import type { Doc } from "./schema.ts";

const q = new URLSearchParams(location.search);
const cfg = {
  user: q.get("user") ?? "u1",
  dv: Number(q.get("dv") ?? 3),
  dev: q.get("dev") ?? "d1",
  retry: Number(q.get("retry") ?? 300),
  limit: Number(q.get("limit") ?? 5),
  sv: Number(q.get("sv") ?? 0),
  sync: q.get("sync") !== "0",
  ttl: q.get("ttl") ? Number(q.get("ttl")) : undefined,
};
const fail = (q.get("fail") ?? "").split(",").filter(Boolean);
if (fail.length || q.get("boom")) {
  faults.step = (to, d) => {
    if ((fail.includes(d.id) || d.note === "boom") && (!q.get("failTo") || Number(q.get("failTo")) === to)) throw new Error(`step ${to} failed`);
  };
}

const strip = (d: Doc) => Object.fromEntries(Object.entries(d).filter(([k]) => k !== "_meta" && k !== "_rev" && k !== "_attachments"));
const canon = (d: Doc) => JSON.stringify(Object.keys(d).sort().map((k) => [k, d[k] ?? null]));
const now = () => new Date().toISOString();
const json = (docs: any[]) => docs.map((d) => d.toJSON());

try {
  const app = await openApp(cfg);
  const w = window as any;
  const status = document.getElementById("status")!;
  if (app.stale) {
    status.textContent = "stale";
    w.proto = { info: () => ({ stale: true, gate: app.api.gate }) };
    w.__ready = { stale: true };
  } else {
    const { cols, sync } = app;
    const reps = sync!.reps;
    const visible = () => cols.items.find({ selector: { dv: cfg.dv } });
    const live = async () => json(await visible().exec()).filter((d) => d.deleted_at == null);
    w.proto = {
      cfg,
      async addItem(p: Doc = {}) {
        const id = p.id ?? crypto.randomUUID();
        await cols.items.insert({ kind: "movie", title: "T", status: "want", ...p, id, added_at: now(), updated_at: now(), dv: cfg.dv });
        return id as string;
      },
      async updateItem(id: string, patch: Doc) { await (await cols.items.findOne(id).exec())!.incrementalPatch({ ...patch, updated_at: now() }); },
      async softDelete(id: string) { await (await cols.items.findOne(id).exec())!.incrementalPatch({ deleted_at: now(), updated_at: now() }); },
      async setSeason(itemId: string, n: number, state: string) { await cols.seasons.upsert({ id: `${itemId}:${n}`, item_id: itemId, season: n, state, updated_at: now() }); },
      async clearSeason(itemId: string, n: number) { await (await cols.seasons.findOne(`${itemId}:${n}`).exec())?.remove(); },
      items: live,
      async item(id: string) { return (await cols.items.findOne(id).exec())?.toJSON() ?? null; },
      async allItems() { return json(await cols.items.find().exec()); },
      async waiting() { return (await cols.items.find({ selector: { dv: { $lt: cfg.dv } } }).exec()).map((d) => d.id); },
      async seasons() { return json(await cols.seasons.find().exec()); },
      async season(id: string) { return (await cols.seasons.findOne(id).exec())?.toJSON() ?? null; },
      async shows() { return json(await cols.shows.find().exec()); },
      async rejections() { return json(await cols.rejections.find().exec()); },
      async deferred() { return json(await cols.deferred.find().exec()); },
      async replay() { await sync!.replayDeferred(); },
      // Что ещё не ушло: записи, отличные от последнего известного состояния сервера (внутренний API RxDB, публичного нет).
      async queue() {
        const out: string[] = [];
        for (const [coll, rep] of [[cols.items, reps[0]!], [cols.seasons, reps[1]!]] as const) {
          const st = rep.internalReplicationState;
          if (!st) return null;
          const docs = await coll.find().exec();
          const assumed = await getAssumedMasterState(st, docs.map((d) => d.primary));
          for (const d of docs) if (!assumed[d.primary] || canon(strip(assumed[d.primary]!.docData)) !== canon(strip(d.toJSON(true)))) out.push(d.primary);
        }
        return out;
      },
      async inSync() { await Promise.all(reps.map((r) => r.awaitInSync())); },
      pause() { reps.forEach((r) => void r.pause()); },
      resume() { reps.forEach((r) => void r.start()); },
      info: () => ({ gate: app.api.gate, stale: app.stale, waiting: app.api.waiting, migrationMs: app.migrationMs, failedSteps: app.failedSteps.failed, later: stats.later }),
      async isLeader() { return !!(await (app.db as any).isLeader()); },
      async close() { await app.db.close(); },
    };
    const sub = visible().$.subscribe((docs) => {
      status.textContent = String(docs.length);
      w.__ready ??= { firstRender: performance.now(), count: docs.length, migrationMs: app.migrationMs };
    });
    void sub;
    // Дождаться первой выдачи.
    await new Promise((ok) => { const t = setInterval(() => { if (w.__ready) { clearInterval(t); ok(0); } }, 5); });
  }
} catch (e) {
  (window as any).__error = String((e as any)?.stack ?? e);
  console.error(e);
}
