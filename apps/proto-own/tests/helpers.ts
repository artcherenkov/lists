import { chromium, webkit } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

export const BASE = "http://127.0.0.1:14373";
export const SERVER = "http://127.0.0.1:13300";
export const COMPOSE = "docker compose -p lists -f " + new URL("../compose.yaml", import.meta.url).pathname;

const pool = new pg.Pool({ host: "127.0.0.1", port: 15435, user: "postgres", password: "postgres", database: "app", max: 4 });
export const sql = async (text: string, params: unknown[] = []) => (await pool.query(text, params)).rows as any[];
export const closePool = () => pool.end();

export async function admin(path: string, body: unknown = {}) {
  const r = await fetch(SERVER + path, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path}: ${r.status} ${await r.text()}`);
}
export const setVersions = (min: number, cur: number) => Promise.all([admin("/admin/min", { min }), admin("/admin/cur", { cur })]);
export const resetVersions = () => setVersions(1, 1);

export const uid = (prefix = "u") => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function until<T>(read: () => Promise<T>, done: (value: T) => boolean, label: string, timeout = 20_000): Promise<T> {
  const started = Date.now();
  let last: T;
  while (Date.now() - started < timeout) {
    last = await read();
    if (done(last)) return last;
    await sleep(100);
  }
  throw new Error(`не дождались: ${label}; последнее значение ${JSON.stringify(last!)}`);
}

// --- стенд ---

export async function token(user: string): Promise<string> {
  const r = await fetch(`${SERVER}/api/auth/token`, { method: "POST", body: JSON.stringify({ user }) });
  return ((await r.json()) as { token: string }).token;
}

/** Прямой запрос к серверу: так обращается любой, у кого есть токен, минуя приложение. */
export async function api(path: string, opts: { token?: string; dv?: number; json?: unknown } = {}) {
  const headers: Record<string, string> = {};
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.dv !== undefined) headers["x-data-version"] = String(opts.dv);
  const r = await fetch(SERVER + path, { method: opts.json ? "POST" : "GET", headers, body: opts.json ? JSON.stringify(opts.json) : undefined });
  return { status: r.status, body: (await r.json().catch(() => null)) as any };
}

export const edit = (user: string, key: string, entity: "items" | "seasons", id: string, fields: object, v = 1) =>
  ({ key, entity, id, fields, v, acct: user });

// --- устройство: профиль браузера со своей сетью ---

export type Opts = { user: string; dv?: number; retry?: number; attempts?: number; faultyStep?: boolean };

export class Device {
  ctx!: BrowserContext;
  page!: Page;
  logs: string[] = [];
  private constructor(public browserName: "chromium" | "webkit", public name: string, private dir: string, public opts: Opts) {}

  static create(browserName: "chromium" | "webkit", name: string, opts: Opts) {
    return new Device(browserName, `${name}-${Math.random().toString(36).slice(2, 6)}`, mkdtempSync(join(tmpdir(), "own-dev-")), { retry: 300, ...opts });
  }

  url(extra: Partial<Opts> = {}) {
    const o = { dv: 1, ...this.opts, ...extra };
    const q = new URLSearchParams({ user: o.user, dv: String(o.dv), dev: this.name, retry: String(o.retry) });
    if (o.attempts) q.set("attempts", String(o.attempts));
    if (o.faultyStep) q.set("faultyStep", "1");
    return `${BASE}/?${q}`;
  }

  async start(extra: Partial<Opts> = {}) {
    Object.assign(this.opts, extra);
    this.ctx = await { chromium, webkit }[this.browserName].launchPersistentContext(this.dir);
    this.page = this.ctx.pages()[0] ?? (await this.ctx.newPage());
    await this.open(this.page);
    return this;
  }

  /** Открыть приложение на странице и дождаться первого показа. */
  async open(page: Page, extra: Partial<Opts> = {}) {
    page.on("console", (m) => this.logs.push(`${m.type()}: ${m.text()}`));
    page.on("pageerror", (e) => this.logs.push(`pageerror: ${e}`));
    await page.goto(this.url(extra));
    return this.ready(page);
  }

  async ready(page = this.page) {
    await page.waitForFunction(() => (window as any).__ready || (window as any).__error, null, { timeout: 60_000 });
    const error = await page.evaluate(() => (window as any).__error);
    if (error) throw new Error("ошибка приложения: " + error);
    return page.evaluate(() => (window as any).__ready);
  }

  /** Смахнуть приложение из переключателя и открыть заново на том же профиле. */
  async kill() { await this.ctx.close(); }
  async restart(extra: Partial<Opts> = {}) { await this.kill(); this.logs = []; return this.start(extra); }
  async reload() { await this.page.goto(this.url()); return this.ready(); }
  /** Ещё одна вкладка того же устройства; `extra.dv` – окно другой версии. */
  async newTab(extra: Partial<Opts> = {}) {
    const page = await this.ctx.newPage();
    await this.open(page, extra);
    return page;
  }

  private net = (params: Record<string, string | number>) =>
    fetch(`${BASE}/__net?dev=${this.name}&` + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])));
  offline = () => this.net({ offline: 1 });
  online = () => this.net({ offline: 0 });
  blockPush = (on = true) => this.net({ blockPush: on ? 1 : 0 });
  losePushResponses = (n: number) => this.net({ losePush: n });

  eval<R, A = undefined>(fn: (arg: A) => R | Promise<R>, arg?: A, page = this.page): Promise<R> {
    return page.evaluate(fn as any, arg);
  }
  proto(method: string, ...args: unknown[]): Promise<any> {
    return this.protoOn(this.page, method, ...args);
  }
  protoOn(page: Page, method: string, ...args: unknown[]): Promise<any> {
    return page.evaluate(([m, a]) => (window as any).proto[m](...a), [method, args] as const);
  }
  item = (id: string, page = this.page) => page.evaluate((i) => (window as any).proto.db.items.get(i), id);
  season = (id: string) => this.page.evaluate((i) => (window as any).proto.db.seasons.get(i), id);
  show = (id: string) => this.page.evaluate((i) => (window as any).proto.db.shows.get(i), id);
  showIds = (): Promise<string[]> => this.page.evaluate(() => (window as any).proto.db.shows.toCollection().primaryKeys());
  queue = (page = this.page): Promise<any[]> => page.evaluate(() => (window as any).proto.db.queue.toArray());
  items = (page = this.page): Promise<any[]> => page.evaluate(() => (window as any).proto.db.items.toArray());
  rejections = (): Promise<any[]> => this.page.evaluate(() => (window as any).proto.db.rejections.toArray());
  status = (page = this.page): Promise<any> => page.evaluate(() => ({ ...(window as any).proto.status, updateRequired: (window as any).proto.status.updateRequired }));
}

export const queueEmpty = (d: Device, timeout = 30_000) =>
  until(() => d.queue(), (q) => q.length === 0, "очередь не опустела", timeout);

export const serverItem = async (id: string) => (await sql("SELECT * FROM items WHERE id = $1", [id]))[0];
export { execSync };
