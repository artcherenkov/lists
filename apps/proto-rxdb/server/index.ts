import type { Session } from "./auth.ts";
import type { Collection } from "./sync.ts";
import type { IncomingMessage, ServerResponse } from "node:http";

import { createServer } from "node:http";
import pg from "pg";

import { sessionOf } from "./auth.ts";
import { dev } from "./dev.ts";
import { docState, hooks, pool, pull, push, settings } from "./sync.ts";

const PORT = 13200;

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

async function body(req: IncomingMessage) {
  let s = "";
  for await (const chunk of req) s += chunk;
  return s ? JSON.parse(s) : {};
}

// Ворота версии данных (решение 19): младше минимальной – «нужно обновление», новее сервера – «подожди».
async function dataVersion(req: IncomingMessage, res: ServerResponse): Promise<number | null> {
  const dv = Number(req.headers["x-data-version"]);
  const s = await settings();
  if (!(dv >= Number(s.min_dv))) {
    send(res, 426, { error: "update_required", min: Number(s.min_dv) });
    return null;
  }
  if (dv > Number(s.cur_dv)) {
    send(res, 503, { error: "wait" }, { "retry-after": "5" });
    return null;
  }
  return dv;
}

// Живые обновления: SSE без данных, только «забери изменения». Уведомление уходит из триггера при коммите.
const streams = new Set<{ user: string; res: ServerResponse }>();

async function listen() {
  const client = new pg.Client({
    host: "127.0.0.1",
    port: 15434,
    user: "postgres",
    password: "postgres",
    database: "app",
  });
  await client.connect();
  await client.query("LISTEN changes");
  client.on("notification", (m) => {
    for (const s of streams)
      if (m.payload === "*" || m.payload === s.user) s.res.write("data: sync\n\n");
  });
}

function events(res: ServerResponse, session: Session) {
  res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store" });
  res.write("data: sync\n\n");
  const stream = { user: session.user, res };
  streams.add(stream);
  const ping = setInterval(() => res.write(": ping\n\n"), 15_000);
  // Срок токена кончился – закрываем поток, клиент подключится с новым токеном.
  const expire = setTimeout(() => res.end(), Math.max(0, session.exp * 1000 - Date.now()));
  res.on("close", () => {
    streams.delete(stream);
    clearInterval(ping);
    clearTimeout(expire);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url!, "http://x");
  if (await dev(req, res, url)) return;
  const session = await sessionOf(req);
  if (!session) return send(res, 401, { error: "unauthorized" });
  const dv = await dataVersion(req, res);
  if (dv === null) return;

  const [, route, coll, id] = url.pathname.split("/");
  if (route === "events") return events(res, session);
  if (!["items", "seasons", "shows"].includes(coll!)) return send(res, 404, {});
  if (route === "pull") {
    const q = url.searchParams;
    return send(
      res,
      200,
      await pull(
        coll as Collection,
        session.user,
        { seq: Number(q.get("seq")), epoch: q.get("epoch") ?? undefined },
        Number(q.get("limit") ?? 100),
      ),
    );
  }
  if (coll === "shows") return send(res, 403, { error: "read-only" });
  if (route === "ids")
    return send(res, 200, {
      ids: (await pool.query(`SELECT id FROM ${coll} WHERE user_id = $1`, [session.user])).rows.map(
        (r) => r.id,
      ),
    });
  if (route === "doc")
    return send(res, 200, await docState(coll as "items" | "seasons", session.user, id!));
  if (route === "push" && req.method === "POST") {
    const result = await push(
      coll as "items" | "seasons",
      session.user,
      dv,
      (await body(req)).rows,
    );
    if (hooks.loseResponse()) return req.socket.destroy();
    return send(res, 200, result);
  }
  send(res, 404, {});
}

await listen();
createServer((req, res) => {
  handle(req, res).catch(
    (e) => !res.headersSent && send(res, 500, { error: String(e?.message ?? e) }),
  );
}).listen(PORT, "127.0.0.1", () => console.log("server on", PORT));
