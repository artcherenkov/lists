import { expect, test } from "@playwright/test";
import { execSync } from "node:child_process";

import { admin, COMPOSE, Device, queueEmpty, serverItem, sql, uid, until } from "./helpers.ts";

const psql = (args: string, input?: string) =>
  execSync(`${COMPOSE} exec -T own-postgres ${args}`, {
    input,
    maxBuffer: 256 * 1024 * 1024,
  }).toString();
const backup = () => psql("pg_dump -U postgres --clean --if-exists app");
const restore = (dump: string) => psql("psql -U postgres -v ON_ERROR_STOP=1 -q app", dump);

const lastSeq = async () => Number((await sql("SELECT last_value FROM change_seq"))[0].last_value);

async function deviceWithBackup(info: any, user: string) {
  const a = Device.create(info.project.name as "chromium", "A", { user });
  await a.start();
  const i1: string = await a.proto("createItem", { kind: "film", title: "T1" });
  const i2: string = await a.proto("createItem", { kind: "film", title: "T2", rating: 6 });
  await queueEmpty(a);
  const dump = backup();
  // После копии: правка, новая запись и серия – контрольная точка устройства уходит вперёд копии.
  await a.proto("editItem", i1, { title: "T1 после копии" });
  const i3: string = await a.proto("createItem", { kind: "film", title: "T3 после копии" });
  await queueEmpty(a);
  await until(
    () => a.eval(() => (window as any).proto.db.meta.get("cp")),
    (m) => m.value >= 1,
    "устройство загрузило свои изменения",
  );
  const cp = (await a.eval(() => (window as any).proto.db.meta.get("cp"))).value;
  await a.offline();
  await a.proto("editItem", i2, { rating: 9 }); // неотправленная правка
  return { a, dump, i1, i2, i3, cp };
}

test("база сервера восстановлена из копии назад: контрольная точка устройства новее сервера, правки не теряются", async ({}, info) => {
  const user = uid();
  const { a, dump, i1, i2, i3, cp } = await deviceWithBackup(info, user);
  restore(dump);
  expect(await lastSeq()).toBeLessThan(cp);
  expect(await serverItem(i3)).toBeUndefined();

  await a.online();
  await until(
    () => serverItem(i1),
    (r) => r?.title === "T1 после копии",
    "правка до копии вернулась на сервер",
  );
  await until(
    () => serverItem(i3),
    (r) => r?.title === "T3 после копии",
    "запись после копии вернулась на сервер",
  );
  await until(
    () => serverItem(i2),
    (r) => r?.rating === 9,
    "неотправленная правка дошла",
  );
  await queueEmpty(a, 30_000);
  for (const id of [i1, i2, i3]) {
    const server = await serverItem(id);
    await until(
      () => a.item(id),
      (r) => r.title === server.title && (r.rating ?? null) === (server.rating ?? null),
      `копия сошлась: ${id}`,
    );
  }
  await a.kill();
});

test("после восстановления эпоха меняется: устройство замечает его, даже когда номера сервера догнали точку", async ({}, info) => {
  const user = uid();
  const { a, dump, i3, cp } = await deviceWithBackup(info, user);
  restore(dump);
  await admin("/admin/new-epoch"); // шаг восстановления: новая эпоха базы
  const other = uid();
  for (let n = 0; (await lastSeq()) < cp + 1; n++) {
    await sql(
      "INSERT INTO items (id, user_id, kind, title, dv) VALUES ($1, $2, 'film', 'шум', 1)",
      [uid("n"), other],
    );
  }
  expect(await lastSeq()).toBeGreaterThanOrEqual(cp);

  await a.online();
  await until(
    () => serverItem(i3),
    (r) => r?.title === "T3 после копии",
    "запись после копии вернулась на сервер",
  );
  await a.kill();
});
