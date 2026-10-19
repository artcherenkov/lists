import { test, expect } from "@playwright/test";
import { Device, pg, uid } from "./helpers.ts";

test("1. запись без сети переживает перезагрузку и закрытие; очередь уходит", async ({}, info) => {
  const user = uid();
  const d = Device.create(info.project.name as any, "A", { user });
  await d.start();
  await d.offline();
  await expect.poll(async () => (await d.eval(() => (window as any).proto.syncState().core.connected))).toBe(false);

  const id = await d.p("addItem", { kind: "film", title: "Dune", status: "want" });
  await d.p("updateItem", id, { status: "watched", rating: 8 });
  expect((await d.crud()).length).toBeGreaterThan(0);

  // перезагрузка страницы без сети
  await d.reload();
  expect((await d.item(id))?.title).toBe("Dune");
  expect((await d.crud()).length).toBeGreaterThan(0);

  // закрытие всего (смахнули приложение), открытие без сети
  await d.kill();
  await d.start();
  expect((await d.item(id))?.status).toBe("watched");
  const q = await d.crud();
  expect(q.length).toBeGreaterThan(0);
  expect(await pg("select 1 from items where id=$1", [id])).toHaveLength(0);

  // выход в сеть
  await d.online();
  await expect.poll(async () => (await d.crud()).length, { timeout: 30_000 }).toBe(0);
  await expect.poll(async () => (await pg("select title,status,rating,user_id from items where id=$1", [id]))[0]).toEqual({ title: "Dune", status: "watched", rating: 8, user_id: user });
  console.log(`[${info.project.name}] queue after reopen:`, JSON.stringify(q.map((c) => [c.op, c.type, Object.keys(c.data ?? {})])));
  await d.kill();
});
