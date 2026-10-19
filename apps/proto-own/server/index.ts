import type { IncomingMessage, ServerResponse } from "node:http";

import { createServer } from "node:http";

import { ownerOf } from "./auth.ts";
import { pool, setting, setupSchema } from "./db.ts";
import { issueToken, jwks } from "./dev-auth.ts";
import { deployVersion } from "./migrate.ts";
import { PAGE_SIZE, pullPage, startListener, waitForChanges } from "./pull.ts";
import { faults, ownRow, push } from "./push.ts";
import { versionGate } from "./rules.ts";

const PORT = 13300;

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function send(
  res: ServerResponse,
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

/** Каждый запрос проверяется заново, срока токена для этого не ждём. Отправка правок проверяет ещё раз под блокировкой. */
async function checkVersion(req: IncomingMessage, res: ServerResponse): Promise<number | null> {
  const [min, cur] = [Number(await setting(pool, "min_dv")), Number(await setting(pool, "cur_dv"))];
  const blocked = versionGate(Number(req.headers["x-data-version"]), min, cur);
  if (blocked) {
    send(res, blocked.status, blocked.body, blocked.headers);
    return null;
  }
  return cur;
}

async function handleSync(req: IncomingMessage, res: ServerResponse, url: URL) {
  const user = await ownerOf(req);
  if (!user) return send(res, 401, { error: "unauthorized" });
  const cur = await checkVersion(req, res);
  if (cur === null) return;

  const cp = Number(url.searchParams.get("cp") ?? 0);
  const epoch = url.searchParams.get("epoch") || undefined;
  if (url.pathname === "/api/push") {
    const body = await readJson(req);
    if (!Array.isArray(body.edits)) return send(res, 400, { error: "edits" });
    const outcome = await push(user, Number(req.headers["x-data-version"]), body.epoch, body.edits);
    if ("gate" in outcome)
      return send(res, outcome.gate.status, outcome.gate.body, outcome.gate.headers);
    return send(res, 200, outcome);
  }
  if (url.pathname === "/api/pull") {
    const limit = Math.min(Number(url.searchParams.get("limit") ?? PAGE_SIZE), PAGE_SIZE);
    return send(res, 200, await pullPage(user, cp, epoch, limit));
  }
  if (url.pathname === "/api/row") {
    const entity = url.searchParams.get("entity");
    if (entity !== "items" && entity !== "seasons") return send(res, 400, { error: "entity" });
    return send(res, 200, {
      row: await ownRow(pool, entity, url.searchParams.get("id") ?? "", user),
    });
  }
  if (url.pathname === "/api/wait") {
    const abort = new AbortController();
    res.on("close", () => abort.abort());
    await waitForChanges(user, cp, abort.signal);
    return send(res, 200, {});
  }
  send(res, 404, {});
}

// Управление стендом для тестов: подъём версии, подмена настроек, сбой обработчика.
async function handleAdmin(req: IncomingMessage, res: ServerResponse, url: URL) {
  const body = await readJson(req);
  if (url.pathname === "/admin/deploy") {
    await deployVersion(body.to);
    return send(res, 200, {});
  }
  if (url.pathname === "/admin/min") {
    await pool.query("UPDATE settings SET value = $1 WHERE key = 'min_dv'", [String(body.min)]);
    return send(res, 200, {});
  }
  if (url.pathname === "/admin/cur") {
    await pool.query("UPDATE settings SET value = $1 WHERE key = 'cur_dv'", [String(body.cur)]);
    return send(res, 200, {});
  }
  if (url.pathname === "/admin/new-epoch") {
    await pool.query("UPDATE settings SET value = gen_random_uuid()::text WHERE key = 'epoch'");
    return send(res, 200, {});
  }
  if (url.pathname === "/admin/poison") {
    faults.poisonedId = body.id ?? null;
    return send(res, 200, {});
  }
  send(res, 404, {});
}

await setupSchema();
startListener();
createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, "http://x");
    if (url.pathname === "/api/auth/jwks") return send(res, 200, jwks());
    if (req.method === "POST" && url.pathname === "/api/auth/token") {
      return send(res, 200, { token: await issueToken((await readJson(req)).user) });
    }
    if (url.pathname.startsWith("/admin/")) return await handleAdmin(req, res, url);
    if (url.pathname.startsWith("/api/")) return await handleSync(req, res, url);
    send(res, 404, {});
  } catch (error) {
    send(res, 500, { error: String((error as Error).message) });
  }
}).listen(PORT, "127.0.0.1", () => console.log("own server on", PORT));
