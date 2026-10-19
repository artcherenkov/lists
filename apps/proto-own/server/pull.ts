import type { PullResponse, Row } from "../shared/protocol.ts";

import pg from "pg";

import { inTransaction, pool, setting } from "./db.ts";

export const PAGE_SIZE = 500;
const PUBLIC = `- 'user_id' - 'seq'`;

/**
 * Страница изменений человека с номером больше `cp`, по возрастанию номера.
 *
 * Читатель не пропускает изменение, потому что номер выдаёт триггер под блокировкой, которая
 * держится до коммита: транзакция с большим номером не может стать видимой раньше транзакции
 * с меньшим, и контрольная точка «последний номер страницы» ничего не оставляет позади.
 *
 * Каталог приезжает двумя путями. Строка с новым номером – если сериал есть в живых записях человека.
 * Сериал записи из этой страницы – при каждом изменении записи: так сериал, давно лежащий в каталоге,
 * приезжает к тому, кто его только что добавил, а ушедший – помечается удалённым.
 */
export async function pullPage(
  user: string,
  cp: number,
  epoch: string | undefined,
  limit = PAGE_SIZE,
): Promise<PullResponse> {
  return inTransaction(async (client) => {
    const serverEpoch = await setting(client, "epoch");
    const last = (
      await client.query(
        "SELECT CASE WHEN is_called THEN last_value ELSE 0 END AS n FROM change_seq",
      )
    ).rows[0].n;
    const empty = { items: [], seasons: [], shows: [], goneShows: [] };
    if ((epoch && epoch !== serverEpoch) || cp > Number(last)) {
      return { epoch: serverEpoch, reset: true, cp: 0, more: false, ...empty };
    }

    const found = await client.query(
      `SELECT t, seq, row FROM (
         SELECT 'items' AS t, seq, to_jsonb(i) ${PUBLIC} AS row FROM items i WHERE user_id = $1 AND seq > $2
         UNION ALL
         SELECT 'seasons', seq, to_jsonb(s) ${PUBLIC} FROM seasons s WHERE user_id = $1 AND seq > $2
         UNION ALL
         SELECT 'shows', seq, to_jsonb(w) - 'seq' FROM shows w
          WHERE seq > $2 AND EXISTS (SELECT 1 FROM items i WHERE i.user_id = $1 AND i.tmdb_id = w.id AND i.deleted_at IS NULL)
       ) page ORDER BY seq LIMIT $3`,
      [user, cp, limit + 1],
    );
    const more = found.rows.length > limit;
    const rows = found.rows.slice(0, limit);
    const page: PullResponse = {
      epoch: serverEpoch,
      reset: false,
      more,
      cp: rows.length ? Number(rows[rows.length - 1].seq) : cp,
      ...empty,
    };
    for (const { t, row } of rows) page[t as "items" | "seasons" | "shows"].push(row);

    const tmdbIds = page.items.map((r) => r.tmdb_id).filter(Boolean);
    const catalog = await client.query(
      `SELECT to_jsonb(w) - 'seq' AS row, EXISTS (
         SELECT 1 FROM items i WHERE i.user_id = $1 AND i.tmdb_id = w.id AND i.deleted_at IS NULL) AS live
       FROM shows w WHERE w.id = ANY($2)`,
      [user, tmdbIds],
    );
    for (const { row, live } of catalog.rows as { row: Row; live: boolean }[]) {
      if (!live) page.goneShows.push(row.id);
      else if (!page.shows.some((s) => s.id === row.id)) page.shows.push(row);
    }
    return page;
  }, "ISOLATION LEVEL REPEATABLE READ READ ONLY");
}

// --- живые обновления: долгий запрос, который просыпается по NOTIFY ---

const waiters = new Set<() => void>();
const wakeAll = () => waiters.forEach((wake) => wake());

/** Слушатель `changed`. При обрыве переподключается; пока его нет, клиенты узнают об изменениях по таймауту ожидания. */
export function startListener(): void {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: 15435,
    user: "postgres",
    password: "postgres",
    database: "app",
  });
  client.on("notification", wakeAll);
  client.on("error", () => setTimeout(startListener, 1000));
  client
    .connect()
    .then(() => client.query("LISTEN changed"))
    .catch(() => setTimeout(startListener, 1000));
}

const WAIT_MS = 25_000;

/** Ответить, когда у человека появились изменения после `cp` или истёк срок. */
export async function waitForChanges(user: string, cp: number, signal: AbortSignal): Promise<void> {
  let wake!: () => void;
  const woken = new Promise<void>((resolve) => (wake = resolve));
  waiters.add(wake);
  signal.addEventListener("abort", wake);
  try {
    // Сначала встаём в очередь, потом смотрим: изменение между проверкой и ожиданием не потеряется.
    const probe = await pullPage(user, cp, undefined, 1);
    if (probe.reset || probe.cp > cp) return;
    await Promise.race([woken, new Promise((resolve) => setTimeout(resolve, WAIT_MS))]);
  } finally {
    waiters.delete(wake);
  }
}
