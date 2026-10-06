import { liveQuery } from "dexie";

import { BUILD, DATA_VERSION, FAULTY_STEP, LABEL, TEST_PARAMS, USER } from "./config.ts";
import { db } from "./db.ts";
import { faultySteps } from "./faulty.ts";
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
} from "./journal.ts";
import { migrateCopy, stuckCount } from "./migrate.ts";
import { registerPwa } from "./pwa.ts";
import { createItem, deleteItem, editItem, markSeason, restoreItem } from "./store.ts";
import { kick, labKey, reloadAll, reloadOne, startSync, status } from "./sync.ts";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const listEl = $("list");
const statusEl = $("status");

/** Метка устройства в записях макета: по ней видно, кто создал запись, и считается «создано кнопкой – найдено». */
const tag = (() => {
  let t = lab.get("lab-tag");
  if (!t) lab.set("lab-tag", (t = Math.random().toString(36).slice(2, 6)));
  return t;
})();
const markerPrefix = `lab#${tag}#`;
const created = () => Number(lab.get("lab-created") ?? 0);
const maxRating = DATA_VERSION >= 2 ? 5 : 10;
let startupChecked = false;

installGlobalHandlers();

function renderHeader() {
  $("label").textContent = LABEL;
  $("build").textContent =
    `данные v${DATA_VERSION} · сборка ${BUILD} · аккаунт ${USER} · устройство ${tag}`;
}

/** Список и строка состояния; перерисовываются, когда меняется база – в том числе из другой вкладки. */
function show() {
  liveQuery(async () => {
    const all = await db.items.where("dv").equals(DATA_VERSION).toArray();
    const queue = await db.queue.toArray();
    const live = all.filter((r) => !r.deleted_at);
    return {
      items: live.sort((a, b) => String(b.added_at).localeCompare(String(a.added_at))),
      queued: new Set(queue.map((e) => e.id)),
      mine: live.filter((r) => String(r.note ?? "").startsWith(markerPrefix)).length,
      marks: await db.seasons.count(),
      shows: await db.shows.count(),
      queue: queue.length,
      stuck: await stuckCount(),
      rejections: await db.rejections.count(),
    };
  }).subscribe({
    next(view) {
      listEl.replaceChildren(
        ...view.items.slice(0, 40).map((r) => {
          const li = document.createElement("li");
          li.dataset.id = r.id;
          const pending = view.queued.has(r.id);
          li.className = pending ? "pending" : "";
          li.append(`${r.title}  ${r.rating != null ? `★${r.rating}/${maxRating}` : ""}`);
          const small = document.createElement("small");
          small.textContent = pending ? "ждёт отправки" : r.server ? "на сервере" : "только здесь";
          li.append(small);
          return li;
        }),
      );
      statusEl.textContent = `записей ${view.items.length}, отметок ${view.marks}, сериалов ${view.shows}, в очереди ${view.queue}, ждут обновления ${view.stuck}, отказов ${view.rejections}`;
      const check = $("check");
      const expected = created();
      if (expected > 0 || view.mine > 0) {
        const lost = view.mine < expected;
        check.textContent = `создано здесь кнопкой ${expected}, найдено в базе ${view.mine}${lost ? " – НЕ ХВАТАЕТ" : ""}`;
        check.className = lost ? "bad" : "good";
        if (lost && !startupChecked)
          log("error", `ПОТЕРЯ: после запуска создано здесь ${expected}, найдено ${view.mine}`);
      }
      if (!startupChecked) {
        startupChecked = true;
        log(
          "info",
          `запуск: записей ${view.items.length}, создано здесь ${expected}, найдено ${view.mine}, в очереди ${view.queue}`,
        );
      }
      (window as any).__ready ??= { firstRender: performance.now(), count: view.items.length };
    },
    error: (error) => logError("чтение базы (liveQuery)", error),
  });
}

function renderSync() {
  const parts = [
    `сеть: ${navigator.onLine ? "есть" : "нет"}`,
    `сервер: ${status.offline ? "недоступен" : "отвечает"}`,
    `лидер: ${status.leader ? "да" : "нет"}`,
  ];
  if (status.updateRequired) parts.push("нужно обновление");
  if (status.waiting) parts.push("сервер новее, ждём");
  const blocked = $("blocked");
  const message = status.expired
    ? "Срок макета вышел (сервер ответил 410)."
    : status.updateRequired
      ? "Нужно обновление: нажмите «Вышла новая версия», если кнопка есть."
      : "";
  blocked.hidden = !message;
  blocked.textContent = message;
  $("sync").textContent = parts.join(" · ");
  const needKey = status.needLogin || !labKey();
  $("key-form").hidden = !needKey;
  $("key-note").textContent = status.needLogin && labKey() ? "Ключ не подошёл." : "";
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

async function guarded(where: string, action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    logError(where, error);
  }
}

let syncStarted = false;
function beginSync() {
  if (syncStarted || !labKey()) return;
  syncStarted = true;
  startSync();
}

function wireButtons() {
  $("add").addEventListener("click", () =>
    guarded("запись", async () => {
      const n = created() + 1;
      const title = `Запись ${tag}-${n} в ${new Date().toLocaleTimeString("ru-RU")}`;
      await createItem({
        kind: "film",
        title,
        rating: 1 + Math.floor(Math.random() * maxRating),
        note: `${markerPrefix}${n}`,
      });
      lab.set("lab-created", String(n));
    }),
  );
  $("rate").addEventListener("click", () =>
    guarded("правка оценки", async () => {
      const last = (await db.items.where("dv").equals(DATA_VERSION).toArray())
        .filter((r) => !r.deleted_at)
        .sort((a, b) => String(b.added_at).localeCompare(String(a.added_at)))[0];
      if (last) await editItem(last.id, { rating: 1 + Math.floor(Math.random() * maxRating) });
    }),
  );
  $("kick").addEventListener("click", kick);
  $("copy").addEventListener("click", () =>
    navigator.clipboard?.writeText(asText()).then(
      () => log("info", "журнал скопирован"),
      (e) => logError("копирование", e),
    ),
  );
  $("clear").addEventListener("click", clearJournal);
  $("key-form").addEventListener("submit", (event) => {
    event.preventDefault();
    lab.set("lab-key", $<HTMLInputElement>("key").value.trim());
    status.needLogin = false;
    beginSync();
    kick();
    renderSync();
  });
}

function watchDatabase() {
  db.on("close", () => log("error", "IndexedDB: соединение закрыто (close)"));
  db.on("versionchange", () => log("warn", "IndexedDB: versionchange, соединение закрывается"));
  db.on("blocked", () => log("warn", "IndexedDB: открытие заблокировано другой вкладкой"));
}

async function reportStorage() {
  const hidden = Number(lab.get("lab-last-hide") ?? 0);
  const standalone =
    matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
  log(
    "info",
    `открыто ${standalone ? "с экрана «Домой»" : "в браузере"}${hidden ? `, страница ушла ${Math.round((Date.now() - hidden) / 60000)} мин назад` : ""}`,
  );
  try {
    const persisted =
      (await navigator.storage?.persisted?.()) || (await navigator.storage?.persist?.()) || false;
    const estimate = await navigator.storage?.estimate?.();
    log(
      "info",
      `хранилище: persist ${persisted ? "да" : "нет"}, занято ${Math.round((estimate?.usage ?? 0) / 1024)} КБ из ${Math.round((estimate?.quota ?? 0) / 1048576)} МБ`,
    );
  } catch (error) {
    logError("storage.persist", error);
  }
}

async function start() {
  renderHeader();
  onJournal(renderJournal);
  renderJournal();
  watchDatabase();
  if (!TEST_PARAMS) {
    wireButtons();
    registerPwa($("update"));
    void reportStorage();
    setInterval(renderSync, 500);
  }
  const migrated = await migrateCopy(FAULTY_STEP ? faultySteps : undefined);
  status.copyNewer = !migrated;
  if (!migrated) log("warn", "копия на устройстве новее этого окна: нужно обновление");
  show();
  renderSync();
  if (migrated) {
    if (TEST_PARAMS) startSync();
    else beginSync();
  }
}

(window as any).proto = {
  db,
  status,
  kick,
  reloadAll,
  reloadOne,
  createItem,
  editItem,
  deleteItem,
  restoreItem,
  markSeason,
};
start().catch((error) => {
  logError("запуск", error);
  (window as any).__error = describe(error);
});
