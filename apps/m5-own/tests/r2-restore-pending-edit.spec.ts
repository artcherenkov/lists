import { expect, test } from "@playwright/test";
import { execSync } from "node:child_process";

import { admin, COMPOSE, Device, queueEmpty, serverItem, uid, until } from "./helpers.ts";

const psql = (args: string, input?: string) =>
  execSync(`${COMPOSE} exec -T m5t-postgres ${args}`, {
    input,
    maxBuffer: 256 * 1024 * 1024,
  }).toString();
const backup = () => psql("pg_dump -U postgres --clean --if-exists app");
const restore = (dump: string) => psql("psql -U postgres -v ON_ERROR_STOP=1 -q app", dump);

// Требование «правки не теряются» при восстановлении базы из копии: человек правил запись без сети,
// а запись, на которую правка сделана, в базе, восстановленной из копии, уже не существует.
// Отправка идёт раньше загрузки, поэтому устройство узнаёт о восстановлении уже после отказа сервера.
test("после восстановления базы из копии запись и её неотправленная правка не пропадают с устройства и сервера", async ({}, info) => {
  const user = uid();
  const a = Device.create(info.project.name as "chromium", "A", { user });
  await a.start();
  await a.proto("createItem", { kind: "film", title: "До копии" });
  await queueEmpty(a);
  const dump = backup();

  const lost: string = await a.proto("createItem", {
    kind: "film",
    title: "Создана после копии",
    rating: 3,
  });
  await queueEmpty(a);
  await a.offline();
  await a.proto("editItem", lost, { rating: 9 }); // правка записи, которой в копии нет

  restore(dump);
  await admin("/admin/new-epoch"); // обязательный шаг восстановления
  expect(await serverItem(lost)).toBeUndefined();

  await a.online();
  const state = async () =>
    JSON.stringify({
      server: await serverItem(lost),
      device: await a.item(lost),
      rejections: await a.rejections(),
      queue: (await a.queue()).length,
    });
  await until(
    () => serverItem(lost),
    (r) => r?.title === "Создана после копии" && r?.rating === 9,
    "запись с правкой вернулась на сервер",
  ).catch(async (error) => {
    throw new Error(`${error.message}; состояние: ${await state()}`);
  });
  await queueEmpty(a, 30_000);
  expect(await a.item(lost)).toMatchObject({ title: "Создана после копии", rating: 9 });
  await a.kill();
});
