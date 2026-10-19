import { test } from "@playwright/test";
import { execSync } from "node:child_process";
import { admin, Device, pg, sleep, uid, until } from "./helpers.ts";

const stats = () => {
  const out = execSync("docker stats --no-stream --format '{{.Name}} {{.MemUsage}}' ps-postgres ps-powersync").toString().trim().split("\n");
  const r: Record<string, number> = {};
  for (const l of out) {
    const [name, usage] = l.split(" ");
    const m = /([\d.]+)(MiB|GiB|KiB)/.exec(usage)!;
    r[name] = Number(m[1]) * (m[2] === "GiB" ? 1024 : m[2] === "KiB" ? 1 / 1024 : 1);
  }
  return r;
};
const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

test.setTimeout(600_000);
test("11. холодный запуск: 250 записей, 400 отметок, 150 сериалов", async ({}, info) => {
  const browser = info.project.name as "chromium" | "webkit";
  const user = uid("perf");
  const base = 500000 + Math.floor(Math.random() * 400000);
  // сид: 150 сериалов каталога, 150 записей-сериалов, 100 фильмов, 400 отметок
  await pg(`insert into shows(id,title,seasons_json,continuing,updated_at)
    select ($1::int + g)::text, 'Show ' || g, (select json_agg(json_build_object('n', s, 'premiere', '2020-01-01', 'episodes', 10, 'poster', '/abc' || s || '.jpg'))::text from generate_series(1, 1 + g % 5) s), g % 2, now()::text from generate_series(1,150) g`, [base]);
  await pg(`insert into items(id,user_id,kind,title,year,tmdb_id,poster_path,status,rating,added_at,updated_at)
    select 'it-' || $2 || '-' || g, $2, 'series', 'Series title number ' || g, 2000 + g % 25, ($1::int + g)::text, '/poster' || g || '.jpg', 'watching', 1 + g % 10, now()::text, now()::text from generate_series(1,150) g`, [base, user]);
  await pg(`insert into items(id,user_id,kind,title,year,tmdb_id,poster_path,status,rating,added_at,updated_at)
    select 'it-' || $1 || '-f' || g, $1, 'film', 'Film title number ' || g, 1990 + g % 35, (900000 + g)::text, '/fposter' || g || '.jpg', 'watched', 1 + g % 10, now()::text, now()::text from generate_series(1,100) g`, [user]);
  await pg(`insert into seasons(id,user_id,item_id,season,state,updated_at)
    select 'it-' || $1 || '-' || g || ':' || s, $1, 'it-' || $1 || '-' || g, s, 'watched', now()::text from generate_series(1,150) g, generate_series(1, 3) s limit 400`, [user]);
  const counts = await pg(`select (select count(*) from items where user_id=$1)::int i, (select count(*) from seasons where user_id=$1)::int s`, [user]);
  console.log(`[${browser}/${process.env.VFS ?? "opfs"}] данные: записей ${counts[0].i}, отметок ${counts[0].s}, сериалов 150`);

  const idle = stats();
  console.log(`[${browser}] память в покое:`, JSON.stringify(idle));

  // первая загрузка
  const D = Device.create(browser, "P", { user });
  let peak = { ...idle };
  let sampling = true;
  const sampler = (async () => {
    while (sampling) {
      const s = stats();
      for (const k of Object.keys(s)) peak[k] = Math.max(peak[k], s[k]);
      await sleep(300);
    }
  })();
  const t0 = Date.now();
  await D.start();
  await until(() => D.eval(() => ({ i: (window as any).proto.items.size, s: (window as any).proto.seasons.size, sh: (window as any).proto.shows.size })), (v) => v.i === 250 && v.s === counts[0].s && v.sh === 150, 120_000, "first load");
  const firstLoad = Date.now() - t0;
  sampling = false;
  await sampler;
  console.log(`[${browser}] первая загрузка до полного набора: ${firstLoad} мс; пик памяти:`, JSON.stringify(peak));
  const usage = await D.eval(async () => { const e = await navigator.storage.estimate(); return e.usage; });
  console.log(`[${browser}] размер хранилища (storage.estimate): ${Math.round((usage ?? 0) / 1024)} КБ`);
  await sleep(2000);
  console.log(`[${browser}] память после загрузки:`, JSON.stringify(stats()));

  // повторное открытие: онлайн и офлайн
  const run = async (label: string, offline: boolean, n: number) => {
    const firstRender: number[] = [], dbInit: number[] = [];
    for (let i = 0; i < n; i++) {
      await D.kill();
      if (offline) await D.offline(); else await D.online();
      await D.start();
      const r = await D.ready();
      if (r.count !== 250) throw new Error("count " + r.count);
      firstRender.push(r.firstRender);
      dbInit.push(r.dbInit);
    }
    console.log(`[${browser}] повторное открытие (${label}), мс от начала навигации до показа 250 записей: медиана ${Math.round(median(firstRender))}, все ${firstRender.map(Math.round).join("/")}; до открытия БД: медиана ${Math.round(median(dbInit))}`);
  };
  await run("сеть есть, процесс браузера новый", false, 5);
  await run("сети нет, процесс браузера новый", true, 5);
  // перезагрузка страницы в живом браузере
  const reloads: number[] = [];
  for (let i = 0; i < 5; i++) { const r = await D.reload(); reloads.push(r.firstRender); }
  console.log(`[${browser}] перезагрузка страницы в живом браузере: медиана ${Math.round(median(reloads))}, все ${reloads.map(Math.round).join("/")}`);
  await D.online();
  await D.kill();
});
