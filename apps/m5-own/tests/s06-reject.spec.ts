import { expect, test } from "@playwright/test";

import { Device, queueEmpty, serverItem, uid } from "./helpers.ts";

test("6. сервер отклоняет одну правку – очередь идёт дальше, клиент узнаёт об отказе, правка откатывается", async ({}, info) => {
  const user = uid();
  const d = Device.create(info.project.name as "chromium", "A", { user });
  await d.start();
  const x: string = await d.proto("createItem", { kind: "film", title: "X", rating: 3 });
  const y: string = await d.proto("createItem", { kind: "film", title: "Y" });
  await queueEmpty(d);
  await d.offline();

  await d.proto("editItem", x, { rating: 11 }); // оценка вне 1–10: сервер откажет
  await d.proto("editItem", y, { title: "Y2" });
  await d.proto("editItem", x, { note: "после отказа" });
  const bad: string = await d.proto("createItem", { kind: "книга", title: "Не фильм и не сериал" });
  expect((await d.item(x)).rating).toBe(11);

  await d.online();
  await queueEmpty(d);

  expect(await serverItem(y)).toMatchObject({ title: "Y2" });
  expect(await serverItem(x)).toMatchObject({ rating: 3, note: "после отказа" });
  expect(await serverItem(bad)).toBeUndefined();

  const rejections = await d.rejections();
  expect(rejections.map((r) => [r.id, r.error])).toEqual([
    [x, "неверная оценка"],
    [bad, "неверный тип"],
  ]);
  expect((await d.status()).rejected).toBe(2);
  expect(await d.item(x)).toMatchObject({ rating: 3, note: "после отказа" });
  expect(await d.item(bad)).toBeUndefined();
  await d.kill();
});
