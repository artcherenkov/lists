import { test } from "@playwright/test";

import { Device, sql, uid, until } from "./helpers.ts";

const RUNS = 9;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

/** Не проверка, а замер: 250 записей (150 сериалов, 100 фильмов), 400 отметок, 150 сериалов каталога. */
test("повторное открытие с 250 записями, 400 отметками и 150 сериалами", async ({}, info) => {
  test.setTimeout(180_000);
  const user = uid();
  const tag = uid("s");
  await sql(
    `INSERT INTO items (id, user_id, kind, title, tmdb_id, status, dv, added_at, updated_at)
     SELECT $2 || '-i' || n, $1, CASE WHEN n <= 150 THEN 'series' ELSE 'film' END, 'Запись ' || n,
            CASE WHEN n <= 150 THEN $2 || '-t' || n END, 'want', 1, now()::text, now()::text
     FROM generate_series(1, 250) n`,
    [user, tag],
  );
  await sql(
    `INSERT INTO seasons (id, user_id, item_id, season, state, dv, updated_at)
     SELECT $2 || '-i' || ((n - 1) % 150 + 1) || ':' || ((n - 1) / 150 + 1), $1, $2 || '-i' || ((n - 1) % 150 + 1), (n - 1) / 150 + 1, 'watched', 1, now()::text
     FROM generate_series(1, 400) n`,
    [user, tag],
  );
  await sql(
    `INSERT INTO shows (id, title, seasons, updated_at) SELECT $1 || '-t' || n, 'Сериал ' || n, '[1,2,3]'::jsonb, now()::text FROM generate_series(1, 150) n`,
    [tag],
  );

  const d = Device.create(info.project.name as "chromium", "perf", { user });
  const t0 = Date.now();
  await d.start();
  await until(
    () => d.eval(async () => (window as any).proto.db.items.count()),
    (n) => n === 250,
    "250 записей",
  );
  await until(
    () => d.eval(async () => await (window as any).proto.db.seasons.count()),
    (n) => n === 400,
    "400 отметок",
  );
  await until(
    () => d.eval(async () => await (window as any).proto.db.shows.count()),
    (n) => n === 150,
    "150 сериалов",
  );
  const firstLoad = Date.now() - t0;

  const times: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    await d.kill();
    await d.start();
    // firstRender – миллисекунды от начала навигации до первого показа записей из базы
    for (let tries = 0; tries < 50; tries++) {
      const r = await d.eval(() => (window as any).__ready);
      if (r.count === 250) {
        times.push(r.firstRender);
        break;
      }
      await d.page.waitForTimeout(50);
    }
  }
  console.log(
    `PERF ${info.project.name}: первая загрузка ${firstLoad} мс; повторное открытие, мс: ${times.map((t) => t.toFixed(0)).join(" ")}; медиана ${median(times).toFixed(0)}`,
  );
  await d.kill();
});
