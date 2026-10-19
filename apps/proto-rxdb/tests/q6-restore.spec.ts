import { test, expect } from "@playwright/test";
import { execFileSync, spawnSync } from "node:child_process";
import { admin, browserOf, Device, pg, queueEmpty, sleep, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

const compose = (args: string[], input?: string) =>
  spawnSync("docker", ["compose", "-p", "lists", "-f", new URL("../compose.yaml", import.meta.url).pathname, ...args], { input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const dump = () => compose(["exec", "-T", "rx-postgres", "pg_dump", "-U", "postgres", "app"]).stdout;
const restore = (sql: string) => {
  compose(["exec", "-T", "rx-postgres", "psql", "-U", "postgres", "app", "-c", "drop schema public cascade; create schema public;"]);
  const r = compose(["exec", "-T", "rx-postgres", "psql", "-q", "-U", "postgres", "app"], sql);
  if (r.status !== 0) throw new Error(r.stderr);
};

test("q6. база сервера восстановлена из копии, у клиентов правки и контрольная точка новее", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const i1 = await A.p("addItem", { title: "i1 old" });
  const i2 = await A.p("addItem", { title: "i2" });
  await queueEmpty(A);
  await until(() => B.item(i2), (v) => !!v, 15_000);
  const backup = dump();
  expect(backup.length).toBeGreaterThan(1000);

  // после копии: новая запись, правка, и устройство без сети с неотправленной правкой
  const i3 = await A.p("addItem", { title: "i3 created after backup" });
  await A.p("updateItem", i1, { title: "i1 edited after backup" });
  await queueEmpty(A);
  await until(() => B.item(i3), (v) => !!v, 15_000);
  await B.offline();
  await B.p("updateItem", i2, { rating: 2 });

  restore(backup);
  expect(await pg("select id from items where user_id=$1 order by title", [user])).toHaveLength(2);

  // 1. без смены эпохи: номера после восстановления начинаются раньше контрольных точек устройств – изменения не доезжают
  await pg("update items set note = 'server change 1' where id = $1", [i2]);
  await sleep(3000);
  expect((await A.item(i2)).note ?? null).toBeNull();
  console.log("без смены эпохи: правка сервера на устройство не доехала");

  // 2. шаг процедуры: сменить эпоху
  await pg("update settings set value = gen_random_uuid()::text where key = 'epoch'");
  await admin("/dev/ops", { clear: true });
  await pg("update items set note = 'server change 2' where id = $1", [i2]); // будит живые обновления
  await until(() => A.item(i2), (v) => v?.note === "server change 2", 20_000, "A reads from scratch");
  expect((await A.item(i1)).title).toBe("i1 old"); // сервер – источник истины: правка, потерянная при восстановлении, не возвращается
  await B.online();
  await queueEmpty(B);
  await until(() => pg("select rating from items where id=$1", [i2]), (r) => r[0].rating === 2, 20_000, "B unsent edit reached restored row");
  // записи, которых нет в копии, устройства присылают заново
  await until(() => pg("select title from items where id=$1", [i3]), (r) => r.length === 1, 20_000, "orphan resurrected");
  console.log("после смены эпохи: правка B дошла, запись i3 отправлена заново");
  expect((await pg("select title, rating, note from items where id=$1", [i2]))[0]).toEqual({ title: "i2", rating: 2, note: "server change 2" });
  await A.kill();
  await B.kill();
});
