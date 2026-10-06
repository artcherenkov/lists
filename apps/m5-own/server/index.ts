import type { IncomingMessage, ServerResponse } from "node:http";

import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

import { ownerOf } from "./auth.ts";
import { pool, setting, setupSchema } from "./db.ts";
import { issueToken, jwks } from "./dev-auth.ts";
import { deployVersion } from "./migrate.ts";
import { PAGE_SIZE, pullPage, startListener, waitForChanges } from "./pull.ts";
import { faults, ownRow, push } from "./push.ts";
import { versionGate } from "./rules.ts";

declare const __DATA_VERSION__: number | undefined;

const PORT = Number(process.env.PORT ?? 13400);
const HOST = process.env.LISTEN_HOST ?? "127.0.0.1";
/** Стенд тестов (`DEV=1`): токен выдаётся любому, работает `/admin/*`. Без него – режим макета на сервере. */
const DEV = process.env.DEV === "1";
const LAB_KEY = process.env.LAB_KEY ?? "";
const LAB_UNTIL = Date.parse(process.env.LAB_UNTIL ?? "");
const LAB_USERS = (process.env.LAB_USERS ?? "lab")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
/** Версия данных релиза: у собранного бандла – из release.json; у сервера тестов её нет, версию ведут `/admin/*`. */
const RELEASE_DV = typeof __DATA_VERSION__ === "number" ? __DATA_VERSION__ : null;
const MAX_BODY = 1_000_000;

if (!DEV && (!LAB_KEY || Number.isNaN(LAB_UNTIL))) {
  console.error("Нужны LAB_KEY и LAB_UNTIL (дата ISO) – или DEV=1 для стенда тестов");
  process.exit(1);
}

function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY) {
        reject(new Error("тело запроса слишком большое"));
        req.destroy();
      }
    });
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

const SYNC_PATHS = new Set(["/api/push", "/api/pull", "/api/row", "/api/wait"]);

/** Выдача токена макета: только с ключом и только до срока; имя – из заранее заданных. */
async function handleToken(req: IncomingMessage, res: ServerResponse) {
  const { user } = await readJson(req);
  if (DEV) return send(res, 200, { token: await issueToken(user) });
  const given = Buffer.from(String(req.headers["x-lab-key"] ?? ""));
  const key = Buffer.from(LAB_KEY);
  if (given.length !== key.length || !timingSafeEqual(given, key))
    return send(res, 403, { error: "forbidden" });
  if (Date.now() > LAB_UNTIL) return send(res, 410, { error: "expired" });
  if (!LAB_USERS.includes(user)) return send(res, 403, { error: "forbidden" });
  send(res, 200, { token: await issueToken(user) });
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

/**
 * Выкладка нового релиза: сервер при старте сам переводит базу на версию данных релиза (решение 20).
 * Релиз с версией ниже версии базы не включается: откат возвращает код, а не базу.
 */
async function migrateOnStart() {
  if (RELEASE_DV === null) return;
  const cur = Number(await setting(pool, "cur_dv"));
  if (cur > RELEASE_DV) {
    console.error(
      `База на версии данных ${cur}, релиз – ${RELEASE_DV}: старый релиз не включается`,
    );
    process.exit(1);
  }
  if (cur < RELEASE_DV) {
    await deployVersion(RELEASE_DV);
    console.log(`база переведена: версия данных ${cur} -> ${RELEASE_DV}`);
  }
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
await migrateOnStart();
startListener();
createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, "http://x");
    if (url.pathname === "/api/auth/jwks") return send(res, 200, jwks());
    if (url.pathname === "/api/health") {
      await pool.query("SELECT 1");
      return send(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/api/auth/token")
      return await handleToken(req, res);
    if (DEV && url.pathname.startsWith("/admin/")) return await handleAdmin(req, res, url);
    // Неизвестный адрес – 404 до проверки входа: так его видит и проверка выкладки (`/api/x`).
    if (SYNC_PATHS.has(url.pathname)) return await handleSync(req, res, url);
    send(res, 404, {});
  } catch (error) {
    send(res, 500, { error: String((error as Error).message) });
  }
}).listen(PORT, HOST, () => console.log(`own server on ${HOST}:${PORT}${DEV ? " (DEV)" : ""}`));
process.on("SIGTERM", () => process.exit(0));
