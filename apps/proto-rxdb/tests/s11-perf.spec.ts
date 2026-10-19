import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { admin, browserOf, Device, pg, sleep, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);
const SERVER_PID = readFileSync(
  "/private/tmp/claude-501/-Users-a-cherenkov-Workspace-Personal-lists/f46cdedb-3b71-4aa5-9386-0ecac9337190/scratchpad/server.pid",
  "utf8",
).trim();

async function seed(user: string) {
  await pg(
    `insert into items (id, user_id, kind, title, status, rating, added_at, updated_at, dv, tmdb_id)
     select 'it-' || $1 || '-' || g, $1, case when g <= 150 then 'series' else 'movie' end, 'Title ' || g, 'want', 1 + g % 5,
            '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', 3, case when g <= 150 then 'tm-' || $1 || '-' || g end
     from generate_series(1, 250) g`,
    [user],
  );
  await pg(
    `insert into seasons (id, user_id, item_id, season, state, updated_at)
     select 'it-' || $1 || '-' || ((g - 1) % 150 + 1) || ':' || ((g - 1) / 150 + 1), $1, 'it-' || $1 || '-' || ((g - 1) % 150 + 1), (g - 1) / 150 + 1, 'watched', '2026-01-01T00:00:00.000Z'
     from generate_series(1, 400) g`,
    [user],
  );
  await pg(
    `insert into shows (id, title, seasons_json, updated_at) select 'tm-' || $1 || '-' || g, 'Show ' || g, '[1,2,3]', '2026-01-01' from generate_series(1, 150) g`,
    [user],
  );
}

test("11. холодный запуск на 250 записях, 400 отметках и 150 сериалах; цена копирования; память", async ({}, info) => {
  const user = uid();
  await seed(user);
  const name = info.project.name;
  const D = Device.create(browserOf(info), "P", { user });
  const t0 = Date.now();
  await D.start();
  await until(
    async () => ({
      i: (await D.p("items")).length,
      s: (await D.p("seasons")).length,
      h: (await D.p("shows")).length,
    }),
    (v) => v.i === 250 && v.s === 400 && v.h === 150,
    60_000,
    "first load",
  );
  const cold = Date.now() - t0;
  await D.p("inSync");

  const reopen: number[] = [];
  const counts: number[] = [];
  for (let i = 0; i < 5; i++) {
    await D.kill();
    await D.start();
    const r = await D.page.evaluate(() => (window as any).__ready);
    reopen.push(Math.round(r.firstRender));
    counts.push(r.count);
  }
  const heap =
    name === "chromium"
      ? await D.page.evaluate(() =>
          Math.round(((performance as any).memory?.usedJSHeapSize ?? 0) / 1048576),
        )
      : null;
  console.log(
    `[${name}] 11 холодная загрузка с сервера до полных данных: ${cold} мс; повторное открытие до первой выдачи: ${JSON.stringify(reopen)} мс; записей в первой выдаче: ${JSON.stringify(counts)}; куча JS: ${heap} МБ`,
  );
  expect(counts.every((c) => c === 250)).toBe(true);
  const stats = execSync("docker stats --no-stream --format '{{.MemUsage}}' rx-postgres")
    .toString()
    .trim();
  const rss = Math.round(Number(execSync(`ps -o rss= -p ${SERVER_PID}`).toString().trim()) / 1024);
  console.log(`[${name}] 11 память: postgres ${stats}; node сервер RSS ${rss} МБ`);

  // цена копирования коллекции при подъёме версии, без сети (репликации не доходят, метаданные переводятся вместе)
  await D.offline();
  await D.kill();
  await D.start({ extra: "sv=1" });
  const m1 = (await D.page.evaluate(() => (window as any).__ready)).migrationMs;
  await D.kill();
  await D.start({ dv: 4, extra: "sv=1" });
  const m2 = (await D.page.evaluate(() => (window as any).__ready)).migrationMs;
  const first = await D.page.evaluate(() => (window as any).__ready.firstRender);
  console.log(
    `[${name}] 11 копирование: отметки 400 (версия 0→1, тождественный шаг) addCollections ${Math.round(m1)} мс; записи 250 (dv 3→4) addCollections ${Math.round(m2)} мс, до первой выдачи ${Math.round(first)} мс`,
  );
  const all = await D.p("allItems");
  console.log(
    `[${name}] 11 после dv 4: всего ${all.length}, dv: ${JSON.stringify([...new Set(all.map((x: any) => x.dv))])}, failedSteps ${(await D.p("info")).failedSteps}, ready ${JSON.stringify(await D.page.evaluate(() => (window as any).__ready))}`,
  );
  expect((await D.p("items")).length).toBe(250);
  await D.kill();
});
