import type { BrowserContext, Page } from "@playwright/test";

import { chromium, webkit } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const BASE = "http://127.0.0.1:14273";
export const API = "http://127.0.0.1:13200";

export async function admin(path: string, body: unknown = {}) {
  const r = await fetch(API + path, { method: "POST", body: JSON.stringify(body) });
  return r.json() as Promise<any>;
}
export const pg = async (sql: string, params: unknown[] = []) =>
  (await admin("/dev/sql", { sql, params })).rows as any[];
export const uid = (p = "u") => `${p}-${Math.random().toString(36).slice(2, 8)}`;
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Opts = { user: string; dv?: number; extra?: string };

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
      mkdtempSync(join(tmpdir(), "rxdev-")),
      opts,
    );
  }

  url(extra: Partial<Opts> = {}) {
    const o = { dv: 3, extra: "", ...this.opts, ...extra };
    return `${BASE}/?user=${o.user}&dv=${o.dv}&dev=${this.name}${o.extra ? "&" + o.extra : ""}`;
  }

  async start(extra: Partial<Opts> = {}) {
    Object.assign(this.opts, extra);
    this.ctx = await { chromium, webkit }[this.browserName].launchPersistentContext(this.dir);
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

  async ready(page = this.page) {
    await page.waitForFunction(() => (window as any).__ready || (window as any).__error, null, {
      timeout: 60_000,
    });
    const err = await page.evaluate(() => (window as any).__error);
    if (err) throw new Error("app error: " + err);
    return page.evaluate(() => (window as any).__ready);
  }

  /** Закрыть всё – как смахнуть приложение – и открыть заново на том же профиле. */
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
  /** Вторая вкладка того же профиля. */
  async tab(extra: Partial<Opts> = {}) {
    const page = await this.ctx.newPage();
    this.attach(page);
    await page.goto(this.url(extra));
    await this.ready(page);
    return page;
  }

  async offline() {
    await fetch(`${BASE}/__net/off?dev=${this.name}`);
  }
  async online() {
    await fetch(`${BASE}/__net/on?dev=${this.name}`);
  }

  p(method: string, ...args: any[]): Promise<any> {
    return Device.call(this.page, method, ...args);
  }
  static call(page: Page, method: string, ...args: any[]): Promise<any> {
    return page.evaluate(([m, a]) => (window as any).proto[m](...a), [method, args] as const);
  }
  async item(id: string) {
    return this.p("item", id);
  }
  async itemIds() {
    return (await this.p("items")).map((d: any) => d.id);
  }
}

export async function queueEmpty(d: Device, timeout = 30_000) {
  const start = Date.now();
  let last: any;
  while (Date.now() - start < timeout) {
    last = await d.p("queue");
    if (last && last.length === 0) return true;
    await sleep(200);
  }
  throw new Error("queue not empty: " + JSON.stringify(last));
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
export const browserOf = (info: any) => info.project.name as "chromium" | "webkit";
export const opsLog = async (clear = true) => (await admin("/dev/ops", { clear })).ops as any[];
