import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";

import { startSwitchableServer, type SwitchableServer } from "../switchable-server.ts";

let root: string;
let server: SwitchableServer | undefined;

// Одинаковые размер и время изменения у `sw.js` двух сборок – условие, при котором `vite preview`
// отвечает на условный запрос кодом 304.
const SAME_TIME = new Date("2026-01-01T10:00:00Z");

async function writeBuild(dir: string, serviceWorker: string) {
  await mkdir(dir);
  const file = join(dir, "sw.js");
  await writeFile(file, serviceWorker);
  await utimes(file, SAME_TIME, SAME_TIME);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "switchable-server-"));
  await writeBuild(join(root, "first"), "// first build");
  await writeBuild(join(root, "next"), "// next build!");
  server = await startSwitchableServer({
    firstBuildDir: join(root, "first"),
    nextBuildDir: join(root, "next"),
  });
});

afterEach(async () => {
  await server?.stop();
  await rm(root, { recursive: true });
});

test("после переключения тот же адрес отдаёт вторую сборку, а условный запрос – полный ответ", async () => {
  const url = `${server!.url}/sw.js`;
  const first = await fetch(url);
  expect(await first.text()).toBe("// first build");

  await server!.switchToNextBuild();
  const conditional = await fetch(url, {
    headers: {
      "if-none-match": first.headers.get("etag")!,
      "if-modified-since": first.headers.get("last-modified")!,
    },
  });

  expect(conditional.status).toBe(200);
  expect(await conditional.text()).toBe("// next build!");
});

test("после остановки сервер не принимает запросы, повторная остановка безвредна", async () => {
  await server!.stop();
  await server!.stop();

  await expect(fetch(`${server!.url}/sw.js`)).rejects.toThrow("fetch failed");
});

test("ожидание ответа заканчивается, когда сервер ответил на запрос именно этого пути", async () => {
  let served = false;
  const waiting = server!.waitUntilServed("/sw.js").then(() => (served = true));

  await fetch(`${server!.url}/other.js`);
  expect(served).toBe(false);

  await (await fetch(`${server!.url}/sw.js`)).text();
  await waiting;
  expect(served).toBe(true);
});
