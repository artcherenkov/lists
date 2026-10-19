// Только для проверок: выдуманные ключ и аккаунты, управление сервером, внедрение сбоев. В продукт не идёт.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { exportJWK, generateKeyPair, importJWK, SignJWT } from "jose";
import type { JWK } from "jose";
import { applyStep } from "../shared/steps.ts";
import { ISSUER } from "./auth.ts";
import { ITEM_FIELDS } from "./rules.ts";
import { hooks, pool } from "./sync.ts";

const KEY_FILE = new URL("./.key.json", import.meta.url).pathname;
let privateKey: CryptoKey;
let publicJwk: JWK;

if (existsSync(KEY_FILE)) {
  const saved = JSON.parse(readFileSync(KEY_FILE, "utf8"));
  privateKey = (await importJWK(saved.priv, "EdDSA")) as CryptoKey;
  publicJwk = saved.pub;
} else {
  const pair = await generateKeyPair("EdDSA", { extractable: true });
  privateKey = pair.privateKey;
  publicJwk = { ...(await exportJWK(pair.publicKey)), kid: "proto-1", alg: "EdDSA", use: "sig" };
  writeFileSync(KEY_FILE, JSON.stringify({ priv: await exportJWK(pair.privateKey), pub: publicJwk }));
}

const poison = new Set<string>();
let loseResponses = 0;
const ops: unknown[] = [];
hooks.beforeApply = (id) => { if (poison.has(id)) throw new Error("injected failure"); };
hooks.onApply = (e) => { ops.push(e); };
hooks.loseResponse = () => loseResponses > 0 && (loseResponses--, true);

async function readJson(req: IncomingMessage) {
  let s = "";
  for await (const chunk of req) s += chunk;
  return s ? JSON.parse(s) : {};
}

// Выкладка, поднявшая версию данных: одна транзакция, приём правок закрыт блокировкой, упавший шаг откатывает всё.
async function migrate(to: number) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(1)");
    for (const row of (await c.query("SELECT * FROM items WHERE dv < $1", [to])).rows) {
      let d = row;
      for (let v = row.dv + 1; v <= to; v++) d = applyStep(v, d);
      const cols = [...ITEM_FIELDS, "dv"];
      await c.query(`UPDATE items SET ${cols.map((k, i) => `${k} = $${i + 2}`).join(",")} WHERE id = $1`, [row.id, ...cols.map((k) => d[k])]);
    }
    await c.query("UPDATE settings SET value = $1 WHERE key IN ('cur_dv', 'min_dv')", [String(to)]);
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}

export async function dev(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean> {
  const out = (b: unknown) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(b)); return true; };
  if (url.pathname === "/jwks") return out({ keys: [publicJwk] });
  if (!url.pathname.startsWith("/dev/")) return false;
  const b = await readJson(req);
  switch (url.pathname) {
    case "/dev/token": {
      const ttl = b.ttl ?? 300;
      const token = await new SignJWT({}).setProtectedHeader({ alg: "EdDSA", kid: publicJwk.kid }).setSubject(b.user).setIssuer(ISSUER).setAudience(ISSUER).setIssuedAt().setExpirationTime(`${ttl}s`).sign(privateKey);
      return out({ token, exp: Math.floor(Date.now() / 1000) + ttl });
    }
    case "/dev/sql": {
      const r = await pool.query(b.sql, b.params ?? []);
      return out({ rows: r.rows });
    }
    case "/dev/settings":
      for (const [k, v] of Object.entries(b)) await pool.query("UPDATE settings SET value = $2 WHERE key = $1", [k, String(v)]);
      return out({});
    case "/dev/migrate":
      await migrate(b.to);
      return out({});
    case "/dev/fail":
      if (b.poison) b.poison.forEach((id: string) => poison.add(id));
      if (b.clear) poison.clear();
      if (b.loseResponses != null) loseResponses = b.loseResponses;
      return out({});
    case "/dev/ops":
      return out({ ops: b.clear ? ops.splice(0) : [...ops] });
    case "/dev/reset":
      await pool.query("TRUNCATE items, seasons, shows, applied_pushes");
      await pool.query("UPDATE settings SET value = '1' WHERE key IN ('cur_dv', 'min_dv')");
      poison.clear();
      loseResponses = 0;
      ops.length = 0;
      return out({});
    default:
      res.writeHead(404).end();
      return true;
  }
}
