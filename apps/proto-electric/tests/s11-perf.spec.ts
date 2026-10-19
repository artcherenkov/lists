import { test } from "@playwright/test";
import { execSync } from "node:child_process";

import { newDevice, resetDb, db, launch, closeAll, API } from "./helpers.ts";

test.afterEach(closeAll);

const mem = () =>
  execSync(`docker stats --no-stream --format '{{.Name}}={{.MemUsage}}' el-postgres el-electric`)
    .toString()
    .trim()
    .split("\n")
    .join("  ");
const nodeRss = () =>
  execSync(`ps -o rss= -p $(lsof -nP -iTCP:13100 -sTCP:LISTEN -t | head -1)`).toString().trim();
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

async function seed() {
  await resetDb();
  await db.query(
    `INSERT INTO shows (id,title,seasons) SELECT g, 'Show '||g, '[1,2,3,4]' FROM generate_series(1,150) g`,
  );
  await db.query(
    `INSERT INTO items (id,user_id,kind,title,status,rating,note,tmdb_id,year,poster,added_at,updated_at)
     SELECT gen_random_uuid(),'alice', CASE WHEN g<=150 THEN 'series' ELSE 'movie' END, 'Title number '||g, 'want', 1+g%10, repeat('note ',20), g, 2000+g%25,
            '/poster/'||g||'.jpg', now(), now() FROM generate_series(1,250) g`,
  );
  await db.query(
    `INSERT INTO marks (id,user_id,item_id,season,state,updated_at)
     SELECT i.id||':'||s, 'alice', i.id, s, 'watched', now()
     FROM (SELECT id FROM items WHERE kind='series' ORDER BY tmdb_id LIMIT 100) i, generate_series(1,4) s`,
  );
}
// time from navigation start to "all rows readable", measured inside the page
const timeToData = (d: any) =>
  d.page
    .waitForFunction(
      () => {
        const a = (window as any).app;
        return a && a.items().length >= 250 && a.marks().length >= 400 && a.shows().length >= 150;
      },
      null,
      { polling: "raf", timeout: 60000 },
    )
    .then(() => d.page.evaluate(() => Math.round(performance.now())));

test("s11: cold start with 250 items, 400 marks, 150 shows", async ({}, info) => {
  await seed();
  console.log("MEM at rest (seeded, no client):", mem(), "node rss KB", nodeRss());
  // first load on an empty copy
  const first: number[] = [];
  const reopenOnline: number[] = [];
  const reopenOffline: number[] = [];
  for (let i = 0; i < 3; i++) {
    const f = await newDevice(info.project.name, "a");
    first.push(await timeToData(f));
    if (i === 0)
      console.log("MEM after first load (client connected):", mem(), "node rss KB", nodeRss());
    await new Promise((r) => setTimeout(r, 1500));
    await f.context.close();
    for (let k = 0; k < 3; k++) {
      await launch(f);
      reopenOnline.push(await timeToData(f));
      await new Promise((r) => setTimeout(r, 500));
      await f.context.close();
    }
    await fetch(`${API}/admin/block?tag=a&mode=all`);
    for (let k = 0; k < 3; k++) {
      await launch(f);
      reopenOffline.push(await timeToData(f));
      await f.context.close();
    }
    await fetch(`${API}/admin/block?tag=a&mode=off`);
  }
  console.log(
    `PERF ${info.project.name}: first load ms=${JSON.stringify(first)} median=${median(first)}`,
  );
  console.log(
    `PERF ${info.project.name}: reopen online ms=${JSON.stringify(reopenOnline)} median=${median(reopenOnline)}`,
  );
  console.log(
    `PERF ${info.project.name}: reopen offline ms=${JSON.stringify(reopenOffline)} median=${median(reopenOffline)}`,
  );
});
