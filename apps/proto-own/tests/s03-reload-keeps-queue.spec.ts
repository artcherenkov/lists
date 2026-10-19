import { expect, test } from "@playwright/test";

import { Device, queueEmpty, serverItem, sql, uid, until } from "./helpers.ts";

test("3. новая загрузка с сервера, в том числе одной записи, не стирает очередь", async ({}, info) => {
  const user = uid();
  const d = Device.create(info.project.name as "chromium", "A", { user });
  await d.start();
  const x: string = await d.proto("createItem", { kind: "film", title: "X" });
  const y: string = await d.proto("createItem", { kind: "film", title: "Y" });
  await queueEmpty(d);

  // Отправка недоступна, загрузка работает: в очереди остаётся неотправленная правка.
  await d.blockPush();
  await d.proto("editItem", x, { title: "X-local" });
  expect(await d.queue()).toHaveLength(1);

  await sql("UPDATE items SET note = 'с сервера' WHERE id = $1", [x]);
  await until(
    () => d.item(x),
    (r) => r?.note === "с сервера",
    "правка сервера приехала при непустой очереди",
  );
  expect((await d.item(x)).title).toBe("X-local");
  expect(await d.queue()).toHaveLength(1);

  await d.proto("reloadAll");
  await sql("UPDATE items SET note = 'ещё раз' WHERE id = $1", [x]);
  await until(
    () => d.item(x),
    (r) => r?.note === "ещё раз",
    "полная перезагрузка дошла",
  );
  expect(await d.queue()).toHaveLength(1);
  expect((await d.item(x)).title).toBe("X-local");

  // Одна запись: берём с сервера её состояние, а правка очереди остаётся поверх.
  await d.proto("reloadOne", "items", x);
  expect(await d.queue()).toHaveLength(1);
  expect(await d.item(x)).toMatchObject({ title: "X-local", note: "ещё раз" });
  await d.proto("reloadOne", "items", y);
  expect(await d.queue()).toHaveLength(1);

  await d.blockPush(false);
  await queueEmpty(d);
  expect(await serverItem(x)).toMatchObject({ title: "X-local", note: "ещё раз" });
  await d.kill();
});
