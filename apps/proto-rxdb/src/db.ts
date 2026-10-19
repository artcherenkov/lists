import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
import { RxDBLocalDocumentsPlugin } from "rxdb/plugins/local-documents";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { Api } from "./api.ts";
import { deferredSchema, itemsSchema, rejectionsSchema, seasonsSchema, showsSchema, strategies } from "./schema.ts";
import type { Doc } from "./schema.ts";
import { createSync } from "./sync.ts";
import type { Cols } from "./sync.ts";

addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBLocalDocumentsPlugin);

export type Cfg = { user: string; dv: number; dev: string; retry: number; limit: number; sv: number; sync: boolean; ttl?: number };

export async function openApp(cfg: Cfg) {
  const db = await createRxDatabase({ name: `lists-${cfg.user}`, storage: getRxStorageDexie(), multiInstance: true, localDocuments: true });
  const app = { db, cols: undefined as unknown as Cols, api: new Api(`/api/d/${cfg.dev}`, cfg.user, cfg.dv, cfg.ttl), stale: false, migrationMs: 0, failedSteps: { failed: 0 }, sync: undefined as ReturnType<typeof createSync> | undefined };

  // Маркер версии данных копии: новая версия пишет его до перевода, старое окно по нему не трогает копию и ждёт обновления.
  const marker = async () => Number((await db.getLocal("dv"))?.get("v") ?? 0);
  if ((await marker()) > cfg.dv) {
    app.stale = true;
    return app;
  }
  await db.upsertLocal("dv", { v: cfg.dv });
  db.getLocal$("dv").subscribe((d) => {
    if (d && Number(d.get("v")) > cfg.dv && !app.stale) {
      app.stale = true;
      app.sync?.reps.forEach((r) => void r.cancel());
    }
  });

  const t0 = performance.now();
  const identity = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, (d: Doc) => d]));
  app.cols = (await db.addCollections({
    items: { schema: itemsSchema(cfg.dv), migrationStrategies: strategies(cfg.dv, app.failedSteps) },
    seasons: { schema: seasonsSchema(cfg.sv), migrationStrategies: identity(cfg.sv) },
    shows: { schema: showsSchema },
    rejections: { schema: rejectionsSchema },
    deferred: { schema: deferredSchema },
  })) as unknown as Cols;
  app.migrationMs = performance.now() - t0;

  app.sync = createSync(app.api, app.cols, cfg);
  if (cfg.sync) {
    app.api.listen(new AbortController().signal);
    await app.sync.replayDeferred();
  }
  return app;
}
