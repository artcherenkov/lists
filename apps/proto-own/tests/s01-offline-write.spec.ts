import { expect, test } from "@playwright/test";
import { Device, queueEmpty, serverItem, uid, until } from "./helpers.ts";

test("1. запись без сети переживает перезагрузку и закрытие; после выхода в сеть очередь уходит", async ({}, info) => {
  const user = uid();
  const d = Device.create(info.project.name as "chromium", "A", { user });
  await d.start();
  await d.offline();

  const id: string = await d.proto("createItem", { kind: "film", title: "Дюна", rating: 8 });
  await d.proto("editItem", id, { status: "watched" });
  expect(await d.queue()).toHaveLength(2);

  await d.reload();
  expect((await d.item(id)).title).toBe("Дюна");
  expect(await d.queue()).toHaveLength(2);

  await d.restart();
  expect(await d.item(id)).toMatchObject({ title: "Дюна", status: "watched", rating: 8 });
  expect(await d.queue()).toHaveLength(2);
  expect(await serverItem(id)).toBeUndefined();

  await d.online();
  await queueEmpty(d);
  expect(await serverItem(id)).toMatchObject({ title: "Дюна", status: "watched", rating: 8, user_id: user });
  await d.kill();
});
