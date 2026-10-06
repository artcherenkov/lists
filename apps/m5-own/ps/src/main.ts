import { column, PowerSyncDatabase, Schema, Table, WASQLiteVFS } from "@powersync/web";

import {
  asText,
  clearJournal,
  describe,
  formatTime,
  getEntries,
  installGlobalHandlers,
  lab,
  log,
  logError,
  onJournal,
  useJournalKey,
} from "../../src/journal.ts";
import { registerPwa } from "../../src/pwa.ts";

// Хранилище PowerSync без сервиса и без сервера: только SQLite (wa-sqlite) в OPFS, локальная таблица, отдельная от Dexie база.
useJournalKey("lab-ps-journal");
installGlobalHandlers();

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const VFS = {
  opfs: WASQLiteVFS.OPFSCoopSyncVFS,
  ahp: WASQLiteVFS.AccessHandlePoolVFS,
  idb: WASQLiteVFS.IDBBatchAtomicVFS,
} as const;
type VfsName = keyof typeof VFS;
const LABELS: Record<VfsName, string> = {
  opfs: "OPFS (OPFSCoopSyncVFS)",
  ahp: "OPFS (AccessHandlePoolVFS)",
  idb: "IndexedDB (IDBBatchAtomicVFS)",
};
const vfsName: VfsName =
  (lab.get("ps-vfs") as VfsName) in VFS ? (lab.get("ps-vfs") as VfsName) : "opfs";

const tag = (() => {
  let t = lab.get("lab-ps-tag");
  if (!t) lab.set("lab-ps-tag", (t = Math.random().toString(36).slice(2, 6)));
  return t;
})();
const created = () => Number(lab.get(`lab-ps-created-${vfsName}`) ?? 0);

const schema = new Schema({
  probe: new Table(
    { text: column.text, created_at: column.text, tag: column.text },
    { localOnly: true },
  ),
});
// Своя база у каждого способа хранения: переключатель не показывает чужие строки.
const db = new PowerSyncDatabase({
  schema,
  database: { dbFilename: `lab-ps-${vfsName}.db`, vfs: VFS[vfsName], enableMultiTabs: false },
});

async function render(first = false) {
  const rows = await db.getAll<{ id: string; text: string; created_at: string; tag: string }>(
    "SELECT * FROM probe ORDER BY created_at DESC",
  );
  const mine = rows.filter((r) => r.tag === tag).length;
  $("list").replaceChildren(
    ...rows.slice(0, 40).map((r) => {
      const li = document.createElement("li");
      li.dataset.id = r.id;
      li.textContent = r.text;
      return li;
    }),
  );
  $("status").textContent = `строк ${rows.length}, хранилище ${LABELS[vfsName]}`;
  const expected = created();
  const lost = mine < expected;
  $("check").textContent =
    `записано здесь кнопкой ${expected}, найдено в базе ${mine}${lost ? " – НЕ ХВАТАЕТ" : ""}`;
  $("check").className = lost ? "bad" : "good";
  if (first) {
    log(
      lost ? "error" : "info",
      `${lost ? "ПОТЕРЯ: " : ""}запуск: строк ${rows.length}, записано здесь ${expected}, найдено ${mine}`,
    );
    (window as any).__ready = { count: rows.length };
  }
}

async function addRows(count: number) {
  for (let i = 0; i < count; i++) {
    const n = created() + 1;
    await db.execute("INSERT INTO probe (id, text, created_at, tag) VALUES (uuid(), ?, ?, ?)", [
      `Строка ${tag}-${n} в ${new Date().toLocaleTimeString("ru-RU")}`,
      new Date().toISOString(),
      tag,
    ]);
    lab.set(`lab-ps-created-${vfsName}`, String(n));
  }
  await render();
}

function renderJournal() {
  $("journal").replaceChildren(
    ...[...getEntries()]
      .reverse()
      .slice(0, 80)
      .map((e) => {
        const line = document.createElement("div");
        line.className = e.level;
        line.textContent = `${formatTime(e.t)}${e.n > 1 ? ` ×${e.n}` : ""} ${e.text}`;
        return line;
      }),
  );
}

const guarded = async (where: string, action: () => Promise<unknown>) => {
  try {
    await action();
  } catch (error) {
    logError(where, error);
  }
};

async function start() {
  $("build").textContent = `сборка ${__BUILD__} · база lab-ps-${vfsName}.db · метка ${tag}`;
  onJournal(renderJournal);
  renderJournal();
  const select = $<HTMLSelectElement>("vfs");
  for (const name of Object.keys(VFS) as VfsName[])
    select.add(new Option(LABELS[name], name, false, name === vfsName));
  select.addEventListener("change", () => {
    lab.set("ps-vfs", select.value);
    location.reload();
  });
  $("add").addEventListener("click", () => guarded("запись", () => addRows(1)));
  $("add10").addEventListener("click", () => guarded("запись 10", () => addRows(10)));
  $("copy").addEventListener("click", () =>
    navigator.clipboard?.writeText(asText()).then(
      () => log("info", "журнал скопирован"),
      (e) => logError("копирование", e),
    ),
  );
  $("clear").addEventListener("click", clearJournal);
  registerPwa($("update"));
  const standalone =
    matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  log(
    "info",
    `открыто ${standalone ? "с экрана «Домой»" : "в браузере"}, сеть ${navigator.onLine ? "есть" : "нет"}`,
  );
  try {
    await db.init();
    log("info", `SQLite открыта (${LABELS[vfsName]})`);
    await render(true);
  } catch (error) {
    logError("открытие SQLite", error);
    (window as any).__error = describe(error);
  }
}

(window as any).ps = { db };
void start();
