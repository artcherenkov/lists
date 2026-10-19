import { chromium, webkit, type BrowserContext, type Page } from "@playwright/test";
import fs from "node:fs";
import pg from "pg";

export const API = "http://127.0.0.1:13100";
export const db = new pg.Pool({
  connectionString: "postgresql://postgres:proto@127.0.0.1:15432/proto",
});

export async function resetDb() {
  await db.query("TRUNCATE items, marks, shows, applied_keys");
  await fetch(`${API}/admin/config`, {
    method: "POST",
    body: JSON.stringify({ version: 1, minVersion: 1 }),
  });
  await fetch(`http://127.0.0.1:14173/__build?name=v1`);
}
export async function setBuild(name: string) {
  (globalThis as any).__build = name;
  await fetch(`http://127.0.0.1:14173/__build?name=${name}`);
}
export async function setServer(version: number, minVersion: number) {
  await fetch(`${API}/admin/config`, {
    method: "POST",
    body: JSON.stringify({ version, minVersion }),
  });
}

export type Device = {
  context: BrowserContext;
  page: Page;
  offline: boolean;
  dir: string;
  browserName: string;
  user: string;
  tag: string;
  dbId: string;
};

const types: Record<string, any> = { chromium, webkit };
// WebKit keeps OPFS in one shared store for the origin, outside the profile directory: every device gets its own database name, or devices share one file.
// WebKit in an ephemeral Playwright context fails OPFS getDirectory(), so every device is a persistent context in its own profile directory.
export async function newDevice(
  browserName: string,
  tag: string,
  user = "alice",
  query = "",
  fresh = true,
): Promise<Device> {
  const dir = `/tmp/el-pw/${browserName}-${tag}`;
  if (fresh) fs.rmSync(dir, { recursive: true, force: true });
  await fetch(`${API}/admin/block?tag=${tag}&mode=off`);
  const d = { dir, browserName, user, tag, dbId: `${tag}${Date.now()}`, offline: false } as Device;
  await launch(d, query);
  return d;
}
const opened = new Set<Device>();
export async function closeAll() {
  for (const d of opened) await d.context.close().catch(() => {});
  opened.clear();
}
export async function launch(d: Device, query = "") {
  opened.add(d);
  d.context = await types[d.browserName].launchPersistentContext(d.dir, {});
  d.page = d.context.pages()[0] ?? (await d.context.newPage());
  await openApp(d, d.user, query);
}
export async function closeDevice(d: Device) {
  await d.context.close();
}
export async function restartDevice(d: Device, query = "") {
  await closeDevice(d);
  await launch(d, query);
}

export async function openApp(d: Device, user = "alice", query = "") {
  d.page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await d.page.goto(`/?user=${user}&dev=${d.tag}&db=${d.dbId}${query}`);
  await d.page.waitForFunction(() => (window as any).appReady || (window as any).bootError, null, {
    timeout: 60_000,
  });
  const err = await d.page.evaluate(() => (window as any).bootError);
  if (err) throw new Error("boot: " + err);
}

// "No network" is cut on our server per device (/~tag/ prefix): sockets are reset, including in-flight long polls; static assets stay reachable (a service worker would serve them).
const block = (d: Device, mode: string) => fetch(`${API}/admin/block?tag=${d.tag}&mode=${mode}`);
export async function goOffline(d: Device) {
  d.offline = true;
  await block(d, "all");
}
export async function goOnline(d: Device) {
  d.offline = false;
  await block(d, "off");
  await d.page.evaluate(() => window.dispatchEvent(new Event("online")));
}
export async function blockMutations(d: Device) {
  await block(d, "mutate");
}
export async function unblockMutations(d: Device) {
  await block(d, "off");
  await d.page.evaluate(() => window.dispatchEvent(new Event("online")));
}

export const A = (d: Device) => d.page;
export async function until<T>(fn: () => Promise<T>, pred: (v: T) => boolean, ms = 15000) {
  const end = Date.now() + ms;
  let v: T;
  for (;;) {
    v = await fn();
    if (pred(v)) return v;
    if (Date.now() > end) throw new Error("timeout; last=" + JSON.stringify(v));
    await new Promise((r) => setTimeout(r, 150));
  }
}
export const items = (d: Device) => d.page.evaluate(() => (window as any).app.items());
export const marks = (d: Device) => d.page.evaluate(() => (window as any).app.marks());
export const shows = (d: Device) => d.page.evaluate(() => (window as any).app.shows());
export const outbox = (d: Device) => d.page.evaluate(() => (window as any).app.outbox());
export const pending = (d: Device) =>
  d.page.evaluate(() => (window as any).app.executor.getPendingCount());

let colN = 0;
export async function rotateShapes() {
  await db.query(`ALTER TABLE items ADD COLUMN IF NOT EXISTS spare_${Date.now()}_${colN++} text`);
}
