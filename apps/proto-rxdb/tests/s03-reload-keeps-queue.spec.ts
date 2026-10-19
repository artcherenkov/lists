import { test, expect } from "@playwright/test";
import { browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("3. новая загрузка, в том числе одной записи, не стирает очередь", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const x = await A.p("addItem", { title: "X" });
  const y = await A.p("addItem", { title: "Y" });
  await until(() => B.item(y), (v) => !!v, 15_000);
  await queueEmpty(A);
  await B.offline();
  await B.p("updateItem", x, { title: "X by B" });
  const bNew = await B.p("addItem", { title: "New by B" });
  await A.p("updateItem", x, { note: "note by A" }); // та же запись на другом устройстве
  await A.p("updateItem", y, { note: "only A" });
  // Новая загрузка: другая эпоха базы – читаем всё с начала – и перезапуск приложения без сети.
  await pg("update settings set value = gen_random_uuid()::text where key = 'epoch'");
  await B.restart();
  expect(((await B.p("queue")) as string[]).sort()).toEqual([x, bNew].sort());
  await B.online();
  await until(() => B.item(y), (v) => v?.note === "only A", 20_000, "full reload reached B");
  await queueEmpty(B);
  const row = (await pg("select title, note from items where id=$1", [x]))[0];
  expect(row).toEqual({ title: "X by B", note: "note by A" });
  expect(await pg("select 1 from items where id=$1", [bNew])).toHaveLength(1);
  await until(() => A.item(x), (v) => v?.title === "X by B", 15_000);
  expect((await B.item(x)).note).toBe("note by A");
  await A.kill();
  await B.kill();
});

test("3б. загрузка одной записи с сервера при непустой очереди", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const x = await A.p("addItem", { title: "X" });
  await until(() => B.item(x), (v) => !!v, 15_000);
  await B.offline();
  await B.p("updateItem", x, { note: "B offline" });
  // сервер меняет запись напрямую, как другое устройство: номер строки поднимается
  await pg("update items set title = 'Server title' where id = $1", [x]);
  await B.reload();
  expect((await B.item(x)).note).toBe("B offline");
  await B.online();
  await queueEmpty(B);
  const row = (await pg("select title, note from items where id=$1", [x]))[0];
  expect(row).toEqual({ title: "Server title", note: "B offline" });
  await until(() => B.item(x), (v) => v?.title === "Server title", 15_000, "B got server title");
  await A.kill();
  await B.kill();
});
