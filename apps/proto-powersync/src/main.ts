import { PowerSyncDatabase, WASQLiteVFS } from "@powersync/web";
import { createCollection } from "@tanstack/db";
import { powerSyncCollectionOptions } from "@tanstack/powersync-db-collection";
import { AppSchema } from "./schema.ts";
import { Connector, status } from "./connector.ts";

const q = new URLSearchParams(location.search);
const USER = q.get("user") ?? "alice";
const DV = Number(q.get("dv") ?? 1);
const VFS = q.get("vfs") ?? "opfs";
const DEV = q.get("dev") ?? "x";
const AUTOCONNECT = q.get("connect") !== "0";
const MIGRATE = q.get("migrate") !== "0";
const t0 = 0; // отметки – от начала навигации (performance.now() без вычитания)

const vfs = { opfs: WASQLiteVFS.OPFSCoopSyncVFS, idb: WASQLiteVFS.IDBBatchAtomicVFS, ahp: WASQLiteVFS.AccessHandlePoolVFS }[VFS]!;

export const db = new PowerSyncDatabase({
  schema: AppSchema,
  database: { dbFilename: `proto-${USER}-${DEV}-${VFS}.db`, vfs },
  flags: q.get("tabs") === "1" ? {} : { enableMultiTabs: false },
});
const connector = new Connector(USER, DV, DEV);

const items = createCollection(powerSyncCollectionOptions({ database: db, table: AppSchema.props.items }));
const seasons = createCollection(powerSyncCollectionOptions({ database: db, table: AppSchema.props.seasons }));
const shows = createCollection(powerSyncCollectionOptions({ database: db, table: AppSchema.props.shows }));

const meta = () => JSON.stringify({ dv: DV, acct: USER });
const now = () => new Date().toISOString();

function render() {
  const rows = [...items.values()].filter((r: any) => !r.deleted_at);
  document.getElementById("list")!.innerHTML = rows.map((r: any) => `<li data-id="${r.id}">${r.title} ${r.status} ${r.rating ?? ""}</li>`).join("");
  document.getElementById("status")!.textContent = `items=${rows.length} seasons=${seasons.size} shows=${shows.size}`;
}

const timing: Record<string, number> = {};

async function start() {
  await db.init();
  timing.dbInit = performance.now();
  await Promise.all([items.preload(), seasons.preload(), shows.preload()]);
  timing.preload = performance.now();
  if (MIGRATE) await (await import("./migrate.ts")).migrateIfNeeded(db, DV);
  render();
  items.subscribeChanges(render);
  seasons.subscribeChanges(render);
  shows.subscribeChanges(render);
  timing.firstRender = performance.now();
  (window as any).__ready = { ...timing, count: items.size };
  if (AUTOCONNECT) void connect();
}

async function connect() {
  await db.connect(connector, { retryDelayMs: 500, crudUploadThrottleMs: 100 });
}

(window as any).proto = {
  db, items, seasons, shows, status, connector,
  user: USER, dv: DV, vfs: VFS, timing,
  connect,
  disconnect: () => db.disconnect(),
  disconnectAndClear: () => db.disconnectAndClear(),
  addItem(row: any) {
    const id = row.id ?? crypto.randomUUID();
    const tx = items.insert({ added_at: now(), updated_at: now(), status: "want", deleted_at: null, dv: DV, rating: null, ...row, id }, { metadata: meta() });
    return tx.isPersisted.promise.then(() => id);
  },
  updateItem(id: string, patch: any) {
    const tx = items.update(id, { metadata: meta() }, (d: any) => { Object.assign(d, patch, { updated_at: now() }); });
    return tx.isPersisted.promise;
  },
  setSeason(itemId: string, season: number, state: string) {
    const id = `${itemId}:${season}`;
    const tx = seasons.has(id)
      ? seasons.update(id, { metadata: meta() }, (d: any) => { d.state = state; d.updated_at = now(); })
      : seasons.insert({ id, item_id: itemId, season, state, updated_at: now() }, { metadata: meta() });
    return tx.isPersisted.promise;
  },
  clearSeason(itemId: string, season: number) {
    return seasons.delete(`${itemId}:${season}`, { metadata: meta() }).isPersisted.promise;
  },
  sql: (s: string, p: any[] = []) => db.getAll(s, p),
  exec: (s: string, p: any[] = []) => db.execute(s, p),
  crud: async () =>
    (await db.getAll("SELECT id, tx_id, data FROM ps_crud ORDER BY id")).map((r: any) => ({ id: r.id, tx: r.tx_id, ...JSON.parse(r.data) })),
  syncState: () => ({ ...db.currentStatus.toJSON(), conn: undefined }),
  rows: () => ({ items: [...items.values()], seasons: [...seasons.values()], shows: [...shows.values()] }),
};

start().catch((e) => { (window as any).__error = String(e?.stack ?? e); console.error(e); });
