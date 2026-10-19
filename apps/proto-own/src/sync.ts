import type {
  Edit,
  EditResult,
  Entity,
  Fields,
  PullResponse,
  PushResponse,
  Row,
} from "../shared/protocol.ts";
import type { LocalRow, QueuedEdit } from "./db.ts";

import { liveQuery } from "dexie";

import { EDITABLE } from "../shared/protocol.ts";
import { API, DATA_VERSION, MAX_ATTEMPTS, RETRY_MS, USER } from "./config.ts";
import { db, getMeta, setMeta } from "./db.ts";
import { applyServerRow, assertCopyNotNewer, itemIdOf, UpdateRequired } from "./store.ts";

/** Что видит человек: почему синхронизация стоит. */
export const status = {
  leader: false,
  offline: false,
  /** Клиент младше минимальной версии сервера. */
  tooOld: false,
  /** В очереди правка новее клиента: рядом окно новой версии. */
  newerEdits: false,
  /** Копия на устройстве переведена окном новее этого. */
  copyNewer: false,
  /** Клиент новее сервера: идёт выкладка, повторяем. */
  waiting: false,
  needLogin: false,
  /** Правки, которым сервер отказал или которые не ушли за предел повторов. */
  rejected: 0,
  get updateRequired() {
    return this.tooOld || this.newerEdits || this.copyNewer;
  },
};

/** Сервер ответил, что дальше идти нельзя: очередь не трогаем, повторяем позже. */
class Stopped extends Error {}

// --- запросы ---

let token: string | undefined;

async function fetchToken(): Promise<string> {
  const r = await fetch(`${API}/auth/token`, {
    method: "POST",
    body: JSON.stringify({ user: USER }),
  });
  token = ((await r.json()) as { token: string }).token;
  return token;
}

async function call<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const headers = {
      authorization: `Bearer ${token ?? (await fetchToken())}`,
      "x-data-version": String(DATA_VERSION),
    };
    let response: Response;
    try {
      response = await fetch(`${API}${path}`, {
        ...init,
        headers,
        body: init.json ? JSON.stringify(init.json) : undefined,
      });
    } catch (error) {
      if ((error as Error).name !== "AbortError") status.offline = true;
      throw error;
    }
    status.offline = false;
    if (response.status === 401 && attempt === 0) {
      token = undefined;
      continue;
    }
    status.needLogin = response.status === 401;
    status.tooOld = response.status === 426;
    status.waiting = response.status === 503;
    if (!response.ok)
      throw response.status >= 500 && response.status !== 503
        ? new Error(`сервер ответил ${response.status}`)
        : new Stopped(`${response.status}`);
    return (await response.json()) as T;
  }
}

// --- отправка ---

const wireEdit = ({ key, entity, id, fields, v, acct }: QueuedEdit): Edit => ({
  key,
  entity,
  id,
  fields,
  v,
  acct,
});

/**
 * Правки версии этой сборки по порядку; правка новее сборки ждёт обновления, старее – перевода.
 * Правки записи (и её отметок), у которой есть ждущая правка, ждут вместе с ней: иначе новая правка
 * уйдёт раньше старой, и старая после перевода затрёт её.
 */
async function sendable(): Promise<QueuedEdit[]> {
  const ready: QueuedEdit[] = [];
  const waiting = new Set<string>();
  status.newerEdits = false;
  await db.queue.toCollection().each((edit) => {
    const itemId = itemIdOf(edit.entity, edit.id);
    if (edit.v !== DATA_VERSION) {
      waiting.add(itemId);
      if (edit.v > DATA_VERSION) status.newerEdits = true;
    } else if (!waiting.has(itemId) && ready.length < 100) ready.push(edit);
  });
  return ready;
}

async function pushQueue(): Promise<void> {
  for (let batch = await sendable(); batch.length; batch = await sendable()) {
    const epoch = (await getMeta<string>("epoch")) ?? "";
    const {
      results,
      reset,
      epoch: serverEpoch,
    } = await call<PushResponse>("/push", {
      method: "POST",
      json: { epoch, edits: batch.map(wireEdit) },
    });
    if (reset) {
      // Базу восстановили из копии: правки не применялись. Сперва пересылаем строки, потом очередь идёт дальше.
      await restartFromServer(serverEpoch!);
      continue;
    }
    if (results.length === 0) throw new Error("сервер не обработал ни одной правки");
    const byKey = new Map(batch.map((e) => [e.key, e]));
    let failed = false;
    for (const result of results) {
      const edit = byKey.get(result.key)!;
      if (result.status === "failed") failed = !(await countFailure(edit, result));
      else await settle(edit, result);
    }
    if (failed) throw new Error("правка не ушла: сбой сервера");
  }
}

/** Отметить неудачу; на пределе повторов правка уходит в отказы, и очередь идёт дальше. `true` – правка снята. */
async function countFailure(edit: QueuedEdit, result: EditResult): Promise<boolean> {
  if (edit.attempts + 1 < MAX_ATTEMPTS) {
    await db.queue.update(edit.n!, { attempts: edit.attempts + 1 });
    return false;
  }
  await settle(edit, {
    ...result,
    status: "rejected",
    error: `не ушла за ${MAX_ATTEMPTS} попыток: ${result.error}`,
  });
  return true;
}

/**
 * Правка принята или отклонена: снимаем её с очереди. Отказ откатывает строку к состоянию сервера
 * (с оставшимися правками поверх) и пишется в журнал отказов для человека.
 * Отказ без строки в ответе: если устройство получало эту запись от сервера, а теперь сервер её не знает
 * (базу восстановили из копии), запись не удаляется, а уходит полной правкой. Запись, которую сервер никогда
 * не принимал (`server` не стоит), удаляется, как раньше.
 */
async function settle(edit: QueuedEdit, result: EditResult): Promise<void> {
  await db.transaction("rw", [db.items, db.seasons, db.queue, db.rejections, db.meta], async () => {
    // Ответ пришёл, когда другое окно уже перевело копию: строку старой формы в неё не кладём. Принятая правка
    // снимается (её переведёт и отправит заново новое окно по тому же ключу); отказ ждёт окна новой версии.
    if (((await getMeta<number>("dv")) ?? 0) > DATA_VERSION) {
      if (result.status === "rejected") throw new UpdateRequired();
      await db.queue.delete(edit.n!);
      return;
    }
    if (result.status === "rejected" && !result.row) {
      const local = await db[edit.entity].get(edit.id);
      if (local?.server) {
        // Правка уже вошла в полную правку этой строки (она заменила частичные): отвечать нечему.
        if (!(await db.queue.get(edit.n!))) return;
        if (local.dv === DATA_VERSION) {
          await sendWhole(edit.entity, { ...local, server: false });
          return;
        }
        // Строка другой версии (скрыта упавшим шагом): ждёт исправленной сборки, не удаляем.
        await db.queue.delete(edit.n!);
        await db.rejections.add({
          at: new Date().toISOString(),
          entity: edit.entity,
          id: edit.id,
          fields: edit.fields,
          error: result.error ?? "",
        });
        return;
      }
    }
    await db.queue.delete(edit.n!);
    if (result.status === "rejected") {
      await db.rejections.add({
        at: new Date().toISOString(),
        entity: edit.entity,
        id: edit.id,
        fields: edit.fields,
        error: result.error ?? "",
      });
    }
    if (result.row) await applyServerRow(edit.entity, result.row as Row & { dv: number });
    else if (result.status === "rejected") await db[edit.entity].delete(edit.id);
  });
  if (result.status === "rejected") status.rejected = await db.rejections.count();
}

/**
 * Строка уходит на сервер полной правкой, частичные правки той же строки текущей версии снимаются: частичная
 * правка записи, которой на сервере нет, была бы отклонена. `server: false` – сервер строки сейчас не знает:
 * если и полная правка будет отклонена, строку не пересылаем снова. Вызывать внутри транзакции с `queue`.
 */
async function sendWhole(entity: Entity, row: LocalRow): Promise<void> {
  const covered = await db.queue
    .where("[entity+id]")
    .equals([entity, row.id])
    .filter((e) => e.v === DATA_VERSION)
    .primaryKeys();
  await db.queue.bulkDelete(covered);
  await db[entity].put(row);
  await db.queue.add({
    key: crypto.randomUUID(),
    entity,
    id: row.id,
    fields: pick(row, EDITABLE[entity]),
    v: DATA_VERSION,
    acct: USER,
    attempts: 0,
  });
}

// --- загрузка ---

async function pullAll(): Promise<void> {
  for (;;) {
    const cp = (await getMeta<number>("cp")) ?? 0;
    const epoch = (await getMeta<string>("epoch")) ?? "";
    const page = await call<PullResponse>(`/pull?cp=${cp}&epoch=${epoch}`);
    if (page.reset) await restartFromServer(page.epoch);
    else await applyPage(page);
    if (!page.reset && !page.more) return;
  }
}

async function applyPage(page: PullResponse): Promise<void> {
  await db.transaction("rw", [db.items, db.seasons, db.shows, db.queue, db.meta], async () => {
    await assertCopyNotNewer();
    for (const row of page.items) await applyServerRow("items", row as Row & { dv: number });
    for (const row of page.seasons) await applyServerRow("seasons", row as Row & { dv: number });
    await db.shows.bulkPut(page.shows);
    await db.shows.bulkDelete(page.goneShows);
    await setMeta("cp", page.cp);
    await setMeta("epoch", page.epoch);
  });
}

const pick = (row: Fields, names: readonly string[]): Fields =>
  Object.fromEntries(names.filter((n) => n in row).map((n) => [n, row[n]]));

/**
 * Сервер не в том состоянии, что помнит устройство: базу восстановили из копии. Копия на устройстве
 * может хранить то, чего на сервере уже нет, поэтому каждая строка уходит полной правкой после
 * очереди – по полю остаётся пришедшая последней. Каталог принадлежит серверу: его загружаем заново.
 * Правки строки текущей версии, уже вошедшие в её полную правку, снимаются: частичная правка записи, которой
 * на сервере нет, была бы отклонена, а строка на устройстве удалена вместе с ней.
 */
async function restartFromServer(epoch: string): Promise<void> {
  await db.transaction("rw", [db.items, db.seasons, db.shows, db.queue, db.meta], async () => {
    await assertCopyNotNewer();
    for (const entity of ["items", "seasons"] as Entity[]) {
      for (const row of await db[entity].where("dv").equals(DATA_VERSION).toArray())
        await sendWhole(entity, row);
    }
    await db.shows.clear();
    await setMeta("cp", 0);
    await setMeta("epoch", epoch);
  });
}

/** Загрузить заново всё, не трогая очередь: правки очереди ложатся поверх. */
export async function reloadAll(): Promise<void> {
  await db.transaction("rw", db.meta, async () => {
    await assertCopyNotNewer();
    await setMeta("cp", 0);
  });
  kick();
}

/** Загрузить заново одну запись или отметку, не трогая очередь. */
export async function reloadOne(entity: Entity, id: string): Promise<void> {
  const { row } = await call<{ row: (LocalRow & { dv: number }) | null }>(
    `/row?entity=${entity}&id=${encodeURIComponent(id)}`,
  );
  if (!row) return;
  await db.transaction("rw", [db.items, db.seasons, db.queue, db.meta], async () => {
    await assertCopyNotNewer();
    await applyServerRow(entity, row);
  });
}

/** Записи, которые не перевелись и скрыты, а сервер их знает: берём их заново, как говорит перевод данных. */
async function reloadStuck(): Promise<void> {
  for (const row of await db.items
    .where("dv")
    .below(DATA_VERSION)
    .filter((r) => !!r.server)
    .toArray()) {
    await reloadOne("items", row.id);
  }
}

// --- цикл лидера ---

let kicked = false;
const sleepers = new Set<() => void>();

/** Разбудить цикл: появилась правка, вернулась сеть, окно стало видимым. */
export function kick(): void {
  kicked = true;
  sleepers.forEach((wake) => wake());
}

const nextKick = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const wake = () => {
      sleepers.delete(wake);
      resolve();
    };
    sleepers.add(wake);
    signal.addEventListener("abort", wake);
  });

/**
 * Ждать, пока сервер сообщит об изменении или кто-то разбудит цикл. Будильник ставится до любого `await`:
 * иначе пробуждение между проверкой `kicked` и постановкой будильника теряется, и правка ждёт конца долгого запроса.
 */
async function idle(): Promise<void> {
  const abort = new AbortController();
  const woken = nextKick(abort.signal);
  if (kicked) {
    abort.abort();
    return;
  }
  const waited = call(`/wait?cp=${(await getMeta<number>("cp")) ?? 0}`, {
    signal: abort.signal,
  }).catch((e) => {
    if ((e as Error).name !== "AbortError") throw e;
  });
  await Promise.race([waited, woken]);
  abort.abort();
}

async function pause(ms: number): Promise<void> {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), ms);
  await nextKick(abort.signal);
  clearTimeout(timer);
}

/** Загрузка идёт, даже когда отправка застряла: упавшая правка не останавливает чтение. */
async function cycle(): Promise<void> {
  let failure: unknown;
  try {
    await pushQueue();
  } catch (error) {
    failure = error;
  }
  try {
    await pullAll();
    await reloadStuck();
  } catch (error) {
    failure ??= error;
  }
  if (failure) throw failure;
}

async function loop(): Promise<void> {
  for (;;) {
    try {
      kicked = false;
      await cycle();
      await idle();
    } catch (error) {
      if (error instanceof UpdateRequired) {
        // Копию перевело окно новее: эта вкладка отпускает блокировку лидера, отправку берёт новая.
        status.copyNewer = true;
        status.leader = false;
        return;
      }
      await pause(error instanceof Stopped && status.waiting ? 5000 : RETRY_MS);
    }
  }
}

/** Отправляет и загружает одна вкладка – та, что держит блокировку; остальные узнают об изменениях из базы. */
export function startSync(): void {
  void navigator.locks.request("sync-leader", async () => {
    status.leader = true;
    await loop();
  });
  // Правку могла записать другая вкладка: Dexie сообщает об изменениях очереди между вкладками.
  liveQuery(() => db.queue.count()).subscribe(kick);
  addEventListener("online", kick);
  document.addEventListener(
    "visibilitychange",
    () => document.visibilityState === "visible" && kick(),
  );
}
