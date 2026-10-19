import { liveQuery } from "dexie";
import { DATA_VERSION, FAULTY_STEP } from "./config.ts";
import { db } from "./db.ts";
import { faultySteps } from "./faulty.ts";
import { migrateCopy, stuckCount } from "./migrate.ts";
import { createItem, deleteItem, editItem, markSeason, restoreItem } from "./store.ts";
import { kick, reloadAll, reloadOne, startSync, status } from "./sync.ts";

const listEl = document.getElementById("list")!;
const statusEl = document.getElementById("status")!;
let firstRender = 0;

/** Список и строка состояния; перерисовываются, когда меняется база – в том числе из другой вкладки. */
function show() {
  liveQuery(async () => ({
    items: (await db.items.where("dv").equals(DATA_VERSION).toArray()).filter((r) => !r.deleted_at),
    marks: await db.seasons.count(),
    shows: await db.shows.count(),
    queue: await db.queue.count(),
    stuck: await stuckCount(),
  })).subscribe((view) => {
    listEl.innerHTML = view.items.map((r) => `<li data-id="${r.id}">${r.title} ${r.status} ${r.rating ?? ""}</li>`).join("");
    statusEl.textContent = `записей ${view.items.length}, отметок ${view.marks}, сериалов ${view.shows}, в очереди ${view.queue}, ждут обновления ${view.stuck}`;
    firstRender ||= performance.now();
    (window as any).__ready ??= { firstRender, count: view.items.length };
  });
}

async function start() {
  const migrated = await migrateCopy(FAULTY_STEP ? faultySteps : undefined);
  status.copyNewer = !migrated;
  show();
  if (migrated) startSync();
}

(window as any).proto = {
  db, status, kick, reloadAll, reloadOne, createItem, editItem, deleteItem, restoreItem, markSeason,
};
start().catch((error) => ((window as any).__error = String(error)));
