import {
  createBrowserWASQLitePersistence,
  openBrowserWASQLiteOPFSDatabase,
  persistedCollectionOptions,
} from "@tanstack/browser-db-sqlite-persistence";
import { createCollection, createLiveQueryCollection, isNull } from "@tanstack/db";
import { electricCollectionOptions } from "@tanstack/electric-db-collection";
import {
  startOfflineExecutor,
  IndexedDBAdapter,
  NonRetriableError,
} from "@tanstack/offline-transactions";

import { CURRENT, translateEntity, translatePatch } from "./format.ts";

type Row = Record<string, any>;
export type BootOptions = {
  account: string;
  api: string;
  // test hooks
  skipMigration?: boolean;
  schemaVersion?: number;
  dbName?: string;
};

export async function boot(opts: BootOptions) {
  const t0 = performance.now();
  const metrics: Record<string, number> = {};
  const state = {
    updateRequired: false,
    serverOlder: false,
    authWait: false,
    rejections: [] as Array<{
      txId: string;
      status: number;
      field?: string;
      message?: string;
      keys: string[];
    }>,
    errors: [] as string[],
    translated: { rows: 0, outboxTx: 0 },
  };
  try {
    state.rejections = JSON.parse(localStorage.getItem(`rej:${opts.account}`) ?? "[]");
  } catch {}

  // ---- token (cached for offline start) ----
  let token = localStorage.getItem(`tok:${opts.account}`) ?? "";
  const refreshToken = async () => {
    try {
      const r = await fetch(`${opts.api}/dev/token?sub=${opts.account}`);
      token = (await r.json()).token;
      localStorage.setItem(`tok:${opts.account}`, token);
    } catch {}
    return token;
  };
  if (!token) await refreshToken();
  else void refreshToken();
  const authHeader = async () => `Bearer ${token}`;

  // ---- storage ----
  const database = await openBrowserWASQLiteOPFSDatabase({
    databaseName: `lists-${opts.account}${opts.dbName ?? ""}.sqlite`,
  });
  metrics.dbOpen = performance.now() - t0;
  (window as any).bootStage = "dbOpen";
  const persistence = createBrowserWASQLitePersistence({ database });
  const outboxStorage = new IndexedDBAdapter(`lists-outbox-${opts.account}`, "transactions");

  // ---- on-device translation (copy first, then queue), runs before any collection starts ----
  async function migrate() {
    const reg = await database
      .execute<{ table_name: string }>(
        `SELECT table_name FROM collection_registry WHERE collection_id = 'items'`,
      )
      .catch(() => []);
    if (reg[0]) {
      const rows = await database.execute<{ key: string; value: string }>(
        `SELECT key, value FROM "${reg[0].table_name}"`,
      );
      await database.execute("BEGIN");
      for (const r of rows) {
        const obj = JSON.parse(r.value);
        if ((obj.fmt ?? 1) < CURRENT) {
          const next = translateEntity("items", obj);
          await database.execute(`UPDATE "${reg[0].table_name}" SET value = ? WHERE key = ?`, [
            JSON.stringify(next),
            r.key,
          ]);
          state.translated.rows++;
        }
      }
      await database.execute("COMMIT");
    }
    for (const key of await outboxStorage.keys()) {
      const raw = await outboxStorage.get(key);
      if (!raw) continue;
      const tx = JSON.parse(raw);
      const from = tx.metadata?.dataVersion ?? 1;
      if (from >= CURRENT) continue;
      for (const m of tx.mutations) {
        if (m.collectionId !== "items") continue;
        if (m.modified) m.modified = translateEntity("items", unwrap(m.modified));
        if (m.original) m.original = translateEntity("items", unwrap(m.original));
        if (m.changes) m.changes = translatePatch("items", unwrap(m.changes), from);
      }
      tx.metadata = { ...tx.metadata, dataVersion: CURRENT };
      await outboxStorage.set(key, JSON.stringify(tx));
      state.translated.outboxTx++;
    }
  }
  const unwrap = (v: any) => (v && v.__type === "Object" ? v.value : v);
  if (!opts.skipMigration) await migrate();
  metrics.migrated = performance.now() - t0;
  (window as any).bootStage = "migrated";

  // ---- collections ----
  const onShapeError = (name: string) => (e: any) => {
    state.errors.push(`${name}:${e?.status ?? ""}:${e?.message ?? e}`);
    if (e?.status === 426) {
      state.updateRequired = true;
      return; // stop the stream
    }
    if (e?.status === 401) {
      state.authWait = true;
      return refreshToken().then(() => ({
        headers: { Authorization: authHeader, "x-data-version": String(CURRENT) },
      }));
    }
    return {};
  };
  const syncApis: Record<string, any> = {};
  const mk = (name: string) => {
    const base: any = electricCollectionOptions({
      id: name,
      shapeOptions: {
        url: `${opts.api}/shape/${name}`,
        headers: { Authorization: authHeader, "x-data-version": String(CURRENT) },
        onError: onShapeError(name),
      },
      getKey: (r: Row) => r.id as string,
    } as any);
    // keep the sync write handle: it is the only way to put a server row into the copy without making it an edit
    const wrapped = {
      ...base,
      sync: {
        ...base.sync,
        sync: (p: any) => {
          syncApis[name] = p;
          return base.sync.sync(p);
        },
      },
    };
    return createCollection(
      persistedCollectionOptions<Row, string>({
        ...wrapped,
        persistence,
        schemaVersion: opts.schemaVersion ?? 1,
      } as any),
    ) as any;
  };
  const items = mk("items");
  const marks = mk("marks");
  const shows = mk("shows");
  const collections: Record<string, any> = { items, marks, shows };

  // ---- write path ----
  const reject = (txId: string, status: number, body: any, keys: string[]) => {
    state.rejections.push({
      txId,
      status,
      field: body?.field,
      message: body?.message ?? body?.error,
      keys,
    });
    try {
      localStorage.setItem(`rej:${opts.account}`, JSON.stringify(state.rejections));
    } catch {}
  };
  const executor = startOfflineExecutor({
    collections,
    storage: outboxStorage,
    mutationFns: {
      push: async ({ transaction, idempotencyKey }: any) => {
        const from = transaction.metadata?.dataVersion ?? 1;
        if (from > CURRENT) throw new Error("needs-update");
        const mutations = transaction.mutations.map((m: any) => {
          const table = m.collection.id as string;
          return {
            table,
            type: m.type,
            key: m.key,
            modified: m.modified ? translateEntity(table, m.modified) : undefined,
            changes: translatePatch(table, m.changes ?? {}, from),
          };
        });
        const res = await fetch(`${opts.api}/api/mutate`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: await authHeader(),
            "x-data-version": String(CURRENT),
          },
          body: JSON.stringify({
            accountId: transaction.metadata?.accountId,
            dataVersion: CURRENT,
            idempotencyKey,
            mutations,
          }),
        });
        if (res.status === 401) {
          state.authWait = true;
          throw new Error("auth-wait"); // not 401 in text: the library treats that as final
        }
        if (res.status === 426) {
          state.updateRequired = true;
          throw new Error("update-required");
        }
        if (res.status === 503) {
          state.serverOlder = true;
          throw new Error("server-older");
        }
        if (res.status === 403 || res.status === 422) {
          const body = await res.json().catch(() => ({}));
          reject(
            transaction.id,
            res.status,
            body,
            mutations.map((m: any) => m.key),
          );
          throw new NonRetriableError(`rejected: ${body.message ?? body.error}`);
        }
        if (!res.ok) throw new Error(`server-error-${res.status}`);
        state.authWait = false;
        const { txid } = await res.json();
        if (txid != null) {
          const touched = new Set<string>(mutations.map((m: any) => m.table));
          await Promise.all([...touched].map((t) => collections[t].utils.awaitTxId(txid, 15000)));
        }
      },
    },
  });
  await executor.waitForInit();
  metrics.executorReady = performance.now() - t0;
  (window as any).bootStage = "executorReady";

  for (const c of Object.values(collections)) void c.preload();
  metrics.collectionsStarted = performance.now() - t0;
  (window as any).bootStage = "collectionsStarted";

  // ---- app API (what screens would call) ----
  const meta = () => ({ dataVersion: CURRENT, accountId: opts.account });
  const now = () => new Date().toISOString();
  function tx(fn: () => void) {
    const t = executor.createOfflineTransaction({
      mutationFnName: "push",
      autoCommit: false,
      metadata: meta(),
    });
    const inner = t.mutate(fn);
    const done = (t as any).commit().then(
      () => "ok",
      (e: any) => `fail:${e?.message}`,
    );
    inner.isPersisted.promise.catch(() => {});
    return { id: (inner as any).id as string, done };
  }
  const live = createLiveQueryCollection({
    query: (q: any) => q.from({ i: items }).where(({ i }: any) => isNull(i.deleted_at)),
  }) as any;
  const api = {
    live,
    metrics,
    state,
    collections,
    executor,
    database,
    outboxStorage,
    items: () => items.toArray as Row[],
    marks: () => marks.toArray as Row[],
    shows: () => shows.toArray as Row[],
    addItem(p: Row) {
      const id = p.id ?? crypto.randomUUID();
      const t = now();
      return (
        tx(() =>
          items.insert({
            id,
            user_id: opts.account,
            kind: "movie",
            status: "want",
            added_at: t,
            updated_at: t,
            fmt: CURRENT,
            ...p,
          }),
        ).id && id
      );
    },
    edit(id: string, patch: Row) {
      return tx(() =>
        items.update(id, (d: Row) => {
          Object.assign(d, patch, { updated_at: now() });
        }),
      );
    },
    // the app updates the whole row from the form snapshot
    editWholeForm(id: string, formSnapshot: Row, patch: Row) {
      return tx(() =>
        items.update(id, (d: Row) => {
          Object.assign(d, formSnapshot, patch, { updated_at: now() });
        }),
      );
    },
    softDelete(id: string) {
      return tx(() =>
        items.update(id, (d: Row) => {
          d.deleted_at = now();
          d.updated_at = now();
        }),
      );
    },
    setMark(itemId: string, season: number, state: string) {
      const id = `${itemId}:${season}`;
      const existing = marks.get(id);
      return tx(() => {
        if (existing)
          marks.update(id, (d: Row) => {
            d.state = state;
            d.updated_at = now();
          });
        else
          marks.insert({
            id,
            user_id: opts.account,
            item_id: itemId,
            season,
            state,
            updated_at: now(),
          });
      });
    },
    removeMark(itemId: string, season: number) {
      return tx(() => marks.delete(`${itemId}:${season}`));
    },
    // "load one record again" without touching the queue: fetch the row ourselves, write it through sync
    async refreshOne(table: string, id: string) {
      const r = await fetch(`${opts.api}/row/${table}/${id}`, {
        headers: { Authorization: await authHeader(), "x-data-version": String(CURRENT) },
      });
      if (!r.ok) throw new Error(`row fetch ${r.status}`);
      const row = await r.json();
      const p = syncApis[table];
      p.begin();
      p.write({ type: "update", value: row });
      p.commit();
    },
    synced: (table: string, id: string) => collections[table]._state.syncedData.get(id),
    async outbox() {
      return (await executor.peekOutbox()).map((o: any) => ({
        id: o.id,
        retry: o.retryCount,
        phase: o.outboxPhase,
        meta: o.metadata,
        muts: o.mutations.map((m: any) => ({
          t: m.collection.id,
          type: m.type,
          key: m.key,
          changes: m.changes,
        })),
      }));
    },
    async sql(q: string, params: any[] = []) {
      return database.execute(q, params);
    },
  };
  return api;
}
