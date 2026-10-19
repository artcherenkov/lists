import type { BrowserContext, Page } from "@playwright/test";

import { chromium, webkit } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const BASE = "http://127.0.0.1:18173";
export const API = "http://127.0.0.1:18100";

export async function admin(path: string, body: unknown = {}) {
  const r = await fetch(API + path, { method: "POST", body: JSON.stringify(body) });
  return r.json() as Promise<any>;
}
export const pg = async (sql: string, params: unknown[] = []) =>
  (await admin("/admin/sql", { sql, params })).rows as any[];
export const uid = (p = "u") => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export type Opts = {
  user: string;
  dv?: number;
  vfs?: string;
  connect?: boolean;
  migrate?: boolean;
};

export class Device {
  ctx!: BrowserContext;
  page!: Page;
  logs: string[] = [];
  constructor(
    public browserName: "chromium" | "webkit",
    public name: string,
    public dir: string,
    public opts: Opts,
  ) {}

  static create(browserName: "chromium" | "webkit", name: string, opts: Opts) {
    return new Device(
      browserName,
      name + "-" + Math.random().toString(36).slice(2, 6),
      mkdtempSync(join(tmpdir(), "pwdev-")),
      opts,
    );
  }

  url(extra: Partial<Opts> = {}) {
    const o = {
      dv: 1,
      vfs: process.env.VFS ?? "opfs",
      connect: true,
      migrate: true,
      ...this.opts,
      ...extra,
    };
    return `${BASE}/?user=${o.user}&dv=${o.dv}&vfs=${o.vfs}&dev=${this.name}&connect=${o.connect ? 1 : 0}&migrate=${o.migrate ? 1 : 0}`;
  }

  async start(extra: Partial<Opts> = {}) {
    Object.assign(this.opts, extra);
    const type = { chromium, webkit }[this.browserName];
    this.ctx = await type.launchPersistentContext(this.dir);
    this.page = this.ctx.pages()[0] ?? (await this.ctx.newPage());
    this.attach(this.page);
    await this.page.goto(this.url());
    await this.ready();
    return this;
  }

  attach(p: Page) {
    p.on("console", (m) => this.logs.push(`${m.type()}: ${m.text()}`));
    p.on("pageerror", (e) => this.logs.push(`pageerror: ${e}`));
  }

  async ready() {
    await this.page.waitForFunction(
      () => (window as any).__ready || (window as any).__error,
      null,
      { timeout: 60_000 },
    );
    const err = await this.page.evaluate(() => (window as any).__error);
    if (err) throw new Error("app error: " + err);
    return this.page.evaluate(() => (window as any).__ready);
  }

  /** Закрыть всё – как смахнуть приложение из переключателя – и открыть заново на том же профиле. */
  async kill() {
    await this.ctx.close();
  }
  async restart(extra: Partial<Opts> = {}) {
    await this.kill();
    this.logs = [];
    return this.start(extra);
  }
  async reload(extra: Partial<Opts> = {}) {
    Object.assign(this.opts, extra);
    await this.page.goto(this.url());
    return this.ready();
  }

  async offline() {
    await fetch(`${BASE}/__net/off?dev=${this.name}`);
  }
  async online() {
    await fetch(`${BASE}/__net/on?dev=${this.name}`);
  }

  eval<R = any, A = any>(fn: (a: A) => R | Promise<R>, arg?: A): Promise<R> {
    return this.page.evaluate(fn as any, arg);
  }
  p<K extends string>(method: K, ...args: any[]): Promise<any> {
    return this.page.evaluate(([m, a]) => (window as any).proto[m](...a), [method, args] as const);
  }
  crud = () => this.p("crud");
  async rows() {
    return this.p("rows");
  }
  async item(id: string) {
    return this.eval((i) => {
      const r = (window as any).proto.items.get(i);
      return r ? { ...r } : undefined;
    }, id);
  }
  async season(id: string) {
    return this.eval((i) => {
      const r = (window as any).proto.seasons.get(i);
      return r ? { ...r } : undefined;
    }, id);
  }
  async show(id: string) {
    return this.eval((i) => {
      const r = (window as any).proto.shows.get(i);
      return r ? { ...r } : undefined;
    }, id);
  }
  async itemIds() {
    return this.eval(() => [...(window as any).proto.items.keys()]);
  }
  async showIds() {
    return this.eval(() => [...(window as any).proto.shows.keys()]);
  }
  async rejections() {
    return this.p("sql", "SELECT * FROM rejections ORDER BY at");
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function queueEmpty(d: Device, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if ((await d.crud()).length === 0) return true;
    await sleep(200);
  }
  throw new Error("queue not empty: " + JSON.stringify(await d.crud()));
}
export async function until<T>(
  fn: () => Promise<T>,
  pred: (v: T) => boolean,
  timeout = 20_000,
  label = "",
) {
  const start = Date.now();
  let last: T;
  while (Date.now() - start < timeout) {
    last = await fn();
    if (pred(last)) return last;
    await sleep(150);
  }
  throw new Error(`timeout ${label}: last=${JSON.stringify(last!)}`);
}
export const opsLog = async (clear = true) =>
  (await admin("/admin/ops-log", { clear })).ops as any[];
