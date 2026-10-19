import type { JWK } from "jose";
import type { IncomingMessage, ServerResponse } from "node:http";

import { exportJWK, generateKeyPair, importJWK, jwtVerify, SignJWT } from "jose";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import pg from "pg";

const PORT = 18100;
const AUDIENCE = "powersync-proto";
const KEY_FILE = new URL("./.key.json", import.meta.url).pathname;
let ttlSeconds = Number(process.env.TOKEN_TTL ?? 300);
const TOKEN_TTL = () => ttlSeconds;
const opsLog: any[] = [];

const pool = new pg.Pool({
  host: "127.0.0.1",
  port: 15433,
  user: "postgres",
  password: "postgres",
  database: "app",
  max: 5,
});

// ключ и JWKS: как у плагина jwt better-auth (EdDSA, /jwks)
let privateKey: CryptoKey;
let publicJwk: JWK;
async function loadKeys() {
  if (existsSync(KEY_FILE)) {
    const saved = JSON.parse(readFileSync(KEY_FILE, "utf8"));
    privateKey = (await importJWK(saved.priv, "EdDSA")) as CryptoKey;
    publicJwk = saved.pub;
    return;
  }
  const pair = await generateKeyPair("EdDSA", { extractable: true });
  privateKey = pair.privateKey;
  publicJwk = { ...(await exportJWK(pair.publicKey)), kid: "proto-1", alg: "EdDSA", use: "sig" };
  writeFileSync(
    KEY_FILE,
    JSON.stringify({ priv: await exportJWK(pair.privateKey), pub: publicJwk }),
  );
}

async function setting(key: string): Promise<number> {
  const r = await pool.query("SELECT value FROM settings WHERE key = $1", [key]);
  return r.rows[0].value;
}

function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let s = "";
    req.on("data", (c) => (s += c));
    req.on("end", () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch (e) {
        reject(e);
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

async function userFromAuth(req: IncomingMessage): Promise<string | null> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(h.slice(7), publicKeyObj, { audience: AUDIENCE });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
let publicKeyObj: CryptoKey;

// --- правила записи ---
const ITEM_COLS = new Set([
  "kind",
  "title",
  "year",
  "tmdb_id",
  "poster_path",
  "status",
  "rating",
  "watched_month",
  "note",
  "added_at",
  "updated_at",
  "deleted_at",
  "dv",
]);
const CREATE_ONLY = new Set(["year", "tmdb_id", "poster_path", "added_at"]);
const STATUSES = new Set(["want", "watching", "watched", "waiting"]);

function validateItem(data: Record<string, any>, creating: boolean, dv: number): string | null {
  for (const k of Object.keys(data)) {
    if (!ITEM_COLS.has(k)) return `unknown field ${k}`;
    if (!creating && CREATE_ONLY.has(k)) return `field ${k} is create-only`;
  }
  if ("kind" in data && !["film", "series"].includes(data.kind)) return "bad kind";
  if ("title" in data && (typeof data.title !== "string" || !data.title || data.title.length > 200))
    return "bad title";
  if ("status" in data && !STATUSES.has(data.status)) return "bad status";
  if ("rating" in data && data.rating !== null) {
    const max = dv >= 2 ? 5 : 10;
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > max) return "bad rating";
  }
  if ("note" in data && typeof data.note === "string" && data.note.length > 2000)
    return "note too long";
  if (data.status === "waiting" && data.kind === "film") return "waiting only for series";
  return null;
}

type Op = {
  op: "PUT" | "PATCH" | "DELETE";
  table: string;
  id: string;
  data?: Record<string, any>;
  metadata?: string;
};
type Result = { id: string; table: string; op: string; status: "ok" | "rejected"; error?: string };

async function applyOp(user: string, dv: number, op: Op): Promise<Result> {
  const base = { id: op.id, table: op.table, op: op.op };
  const rej = (error: string): Result => ({ ...base, status: "rejected", error });
  const data = op.data ?? {};
  if (op.table === "items") {
    if (op.op === "DELETE") {
      const r = await pool.query("DELETE FROM items WHERE id = $1 AND user_id = $2", [op.id, user]);
      return r.rowCount ? { ...base, status: "ok" } : rej("not found or not yours");
    }
    const creating = op.op === "PUT";
    const err = validateItem(data, creating, dv);
    if (err) return rej(err);
    const cols = Object.keys(data);
    if (creating) {
      // вставка-или-обновление: владельца ставит сервер, чужую строку не трогаем
      const allCols = ["id", "user_id", ...cols];
      const vals = [op.id, user, ...cols.map((c) => data[c])];
      const set = cols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");
      const sql =
        `INSERT INTO items (${allCols.join(",")}) VALUES (${allCols.map((_, i) => `$${i + 1}`).join(",")}) ` +
        (set
          ? `ON CONFLICT (id) DO UPDATE SET ${set} WHERE items.user_id = EXCLUDED.user_id`
          : `ON CONFLICT (id) DO NOTHING`);
      const r = await pool.query(sql, vals);
      if (r.rowCount === 0) return rej("id belongs to another account");
      return { ...base, status: "ok" };
    }
    if (cols.length === 0) return { ...base, status: "ok" };
    const set = cols.map((c, i) => `${c} = $${i + 3}`).join(", ");
    const r = await pool.query(`UPDATE items SET ${set} WHERE id = $1 AND user_id = $2`, [
      op.id,
      user,
      ...cols.map((c) => data[c]),
    ]);
    return r.rowCount ? { ...base, status: "ok" } : rej("not found or not yours");
  }
  if (op.table === "seasons") {
    const m = /^(.+):(\d+)$/.exec(op.id);
    if (!m) return rej("bad season id");
    const [, itemId, seasonStr] = m;
    if (op.op === "DELETE") {
      await pool.query("DELETE FROM seasons WHERE id = $1 AND user_id = $2", [op.id, user]);
      return { ...base, status: "ok" };
    }
    for (const k of Object.keys(data))
      if (!["item_id", "season", "state", "updated_at"].includes(k))
        return rej(`unknown field ${k}`);
    if ("state" in data && !["watching", "watched"].includes(data.state)) return rej("bad state");
    const item = await pool.query(
      "SELECT kind, tmdb_id FROM items WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL",
      [itemId, user],
    );
    if (!item.rowCount) return rej("item not found");
    if (item.rows[0].kind !== "series") return rej("marks only for series");
    // PATCH по отсутствующей строке (её удалили на другом устройстве) – вставка, правка не теряется
    const state = data.state ?? "watching";
    await pool.query(
      `INSERT INTO seasons (id, user_id, item_id, season, state, updated_at) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET ${
         ["state", "updated_at"]
           .filter((c) => c in data || (c === "state" && op.op === "PUT"))
           .map((c) => `${c} = EXCLUDED.${c}`)
           .join(", ") || "id = seasons.id"
       }
       WHERE seasons.user_id = EXCLUDED.user_id`,
      [op.id, user, itemId, Number(seasonStr), state, data.updated_at ?? null],
    );
    return { ...base, status: "ok" };
  }
  return rej(`table ${op.table} is not writable`);
}

let failMode: "none" | "500" = "none";

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  if (failMode === "500") return send(res, 500, { error: "injected" });
  const user = await userFromAuth(req);
  if (!user) return send(res, 401, { error: "unauthorized" });
  const dv = Number(req.headers["x-data-version"]);
  const [min, cur] = [await setting("min_dv"), await setting("cur_dv")];
  if (!(dv >= min)) return send(res, 426, { error: "update_required", min });
  if (dv > cur) return send(res, 503, { error: "wait", cur }, { "retry-after": "5" });
  const body = await readBody(req);
  const results: Result[] = [];
  for (const op of body.ops as Op[]) {
    opsLog.push({
      user,
      dv,
      op: op.op,
      table: op.table,
      id: op.id,
      fields: Object.keys(op.data ?? {}),
    });
    try {
      results.push(await applyOp(user, dv, op));
    } catch (e: any) {
      return send(res, 500, { error: String(e?.message ?? e) }); // непредвиденное – очередь остаётся
    }
  }
  send(res, 200, { results });
}

async function handleToken(req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);
  const dv = Number(body.dv);
  const [min, cur] = [await setting("min_dv"), await setting("cur_dv")];
  if (!(dv >= min)) return send(res, 426, { error: "update_required", min });
  if (dv > cur) return send(res, 503, { error: "wait", cur }, { "retry-after": "5" });
  const ttl = TOKEN_TTL();
  const token = await new SignJWT({ dv })
    .setProtectedHeader({ alg: "EdDSA", kid: publicJwk.kid })
    .setSubject(String(body.user))
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(privateKey);
  send(res, 200, { token, expiresAt: Date.now() + ttl * 1000 });
}

async function handleAdmin(path: string, req: IncomingMessage, res: ServerResponse) {
  const body = await readBody(req);
  if (path === "/admin/settings") {
    if (body.min != null)
      await pool.query("UPDATE settings SET value=$1 WHERE key='min_dv'", [body.min]);
    if (body.cur != null)
      await pool.query("UPDATE settings SET value=$1 WHERE key='cur_dv'", [body.cur]);
    return send(res, 200, { min: await setting("min_dv"), cur: await setting("cur_dv") });
  }
  if (path === "/admin/sql") {
    const r = await pool.query(body.sql, body.params ?? []);
    return send(res, 200, { rows: r.rows, rowCount: r.rowCount });
  }
  if (path === "/admin/ttl") {
    ttlSeconds = body.seconds;
    return send(res, 200, { ttlSeconds });
  }
  if (path === "/admin/ops-log") {
    return send(res, 200, { ops: body.clear ? opsLog.splice(0) : [...opsLog] });
  }
  if (path === "/admin/fail") {
    failMode = body.mode;
    return send(res, 200, { failMode });
  }
  if (path === "/admin/reset") {
    await pool.query("TRUNCATE items, seasons, shows");
    opsLog.length = 0;
    ttlSeconds = 300;
    await pool.query("UPDATE settings SET value=1");
    failMode = "none";
    return send(res, 200, {});
  }
  // шаг перевода на сервере при выкладке: одна транзакция, потом включается версия 2
  if (path === "/admin/migrate-2") {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query(
        "UPDATE items SET rating = CASE WHEN rating IS NULL THEN NULL ELSE (rating + 1) / 2 END, dv = 2 WHERE dv = 1",
      );
      await c.query("UPDATE settings SET value = 2 WHERE key IN ('cur_dv','min_dv')");
      await c.query("COMMIT");
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
    return send(res, 200, {});
  }
  send(res, 404, {});
}

async function main() {
  await loadKeys();
  publicKeyObj = (await importJWK(publicJwk, "EdDSA")) as CryptoKey;
  createServer(async (req, res) => {
    try {
      const path = new URL(req.url!, "http://x").pathname;
      if (path === "/jwks.json") return send(res, 200, { keys: [publicJwk] });
      if (req.method === "POST" && path === "/token") return await handleToken(req, res);
      if (req.method === "POST" && path === "/upload") return await handleUpload(req, res);
      if (req.method === "POST" && path.startsWith("/admin/"))
        return await handleAdmin(path, req, res);
      send(res, 404, {});
    } catch (e: any) {
      send(res, 500, { error: String(e?.message ?? e) });
    }
  }).listen(PORT, "127.0.0.1", () => console.log("proto server on", PORT));
}
main();
