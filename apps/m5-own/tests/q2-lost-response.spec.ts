import { expect, test } from "@playwright/test";

import { Device, queueEmpty, serverItem, sql, uid, until } from "./helpers.ts";

test("повтор отправки после потерянного ответа не накладывает устаревшую правку поверх чужой", async ({}, info) => {
  const user = uid();
  const browser = info.project.name as "chromium";
  // Повтор – по сигналу теста, а не по таймеру: чужая правка должна успеть раньше.
  const a = Device.create(browser, "A", { user, retry: 600_000 });
  const b = Device.create(browser, "B", { user });
  await a.start();
  await b.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "Дюна" });
  await queueEmpty(a);
  await until(
    () => b.item(id),
    (r) => !!r,
    "запись приехала на B",
  );

  await a.losePushResponses(1);
  await a.proto("editItem", id, { note: "правка A" });
  await until(
    () => serverItem(id),
    (r) => r.note === "правка A",
    "сервер принял правку A, а ответ потерян",
  );
  expect(await a.queue()).toHaveLength(1);

  await b.proto("editItem", id, { note: "правка B, позже" });
  await until(
    () => serverItem(id),
    (r) => r.note === "правка B, позже",
    "правка B на сервере",
  );

  await a.proto("kick"); // A повторяет отправку той же правки с тем же ключом
  await queueEmpty(a);
  expect((await serverItem(id)).note).toBe("правка B, позже");
  const applied = await sql("SELECT count(*)::int AS n FROM applied_edits WHERE user_id = $1", [
    user,
  ]);
  expect(applied[0].n).toBe(3); // создание и две правки, повтор не добавил четвёртую
  await until(
    () => a.item(id),
    (r) => r.note === "правка B, позже",
    "A сошлось с сервером",
  );
  await a.kill();
  await b.kill();
});
