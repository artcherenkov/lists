import { expect, test } from "@playwright/test";
import { Device, queueEmpty, serverItem, sql, uid, until } from "./helpers.ts";

const browserOf = (info: any) => info.project.name as "chromium";

test("4a. правка уходит только изменёнными полями, даже когда форма сохраняет строку целиком", async ({}, info) => {
  const user = uid();
  const d = Device.create(browserOf(info), "A", { user });
  await d.start();
  const id: string = await d.proto("createItem", { kind: "film", title: "Дюна", rating: 5 });
  await queueEmpty(d);
  await d.blockPush();

  const snapshot = await d.item(id);
  await d.proto("editItem", id, { ...snapshot, rating: 9 });

  const [queued] = await d.queue();
  expect(Object.keys(queued.fields).sort()).toEqual(["rating", "updated_at"]);
  await d.kill();
});

test("4b. два устройства без сети правят разные поля одной записи – сохраняются оба", async ({}, info) => {
  const user = uid();
  const [a, b] = [Device.create(browserOf(info), "A", { user }), Device.create(browserOf(info), "B", { user })];
  await a.start();
  await b.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "Дюна" });
  await until(() => b.item(id), (r) => !!r, "запись приехала на B");
  await a.offline();
  await b.offline();

  await a.proto("editItem", id, { rating: 4 });
  await b.proto("editItem", id, { status: "watched" });
  await a.online();
  await until(() => serverItem(id), (r) => r.rating === 4, "правка A на сервере");
  await b.online();
  await queueEmpty(b);

  expect(await serverItem(id)).toMatchObject({ rating: 4, status: "watched" });
  await until(() => a.item(id), (r) => r.rating === 4 && r.status === "watched", "A сошлось с сервером");
  await until(() => b.item(id), (r) => r.rating === 4 && r.status === "watched", "B сошлось с сервером");
  await a.kill();
  await b.kill();
});

test("4c. одно поле с двух устройств: остаётся правка, пришедшая на сервер последней", async ({}, info) => {
  const user = uid();
  const [a, b] = [Device.create(browserOf(info), "A", { user }), Device.create(browserOf(info), "B", { user })];
  await a.start();
  await b.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "Дюна" });
  await until(() => b.item(id), (r) => !!r, "запись приехала на B");
  await a.offline();
  await b.offline();

  await b.proto("editItem", id, { note: "правка B, сделана раньше" });
  await a.proto("editItem", id, { note: "правка A, сделана позже" });
  await a.online();
  await until(() => serverItem(id), (r) => r.note === "правка A, сделана позже", "правка A на сервере");
  await b.online();
  await queueEmpty(b);

  expect((await serverItem(id)).note).toBe("правка B, сделана раньше");
  await until(() => a.item(id), (r) => r.note === "правка B, сделана раньше", "A получило пришедшую последней");
  await a.kill();
  await b.kill();
});

test("4d. поле, которого клиент не знает, на сервере не затирается", async ({}, info) => {
  const user = uid();
  const d = Device.create(browserOf(info), "A", { user });
  await d.start();
  const id: string = await d.proto("createItem", { kind: "film", title: "Дюна" });
  await queueEmpty(d);
  await sql("UPDATE items SET future_field = 'из новой версии' WHERE id = $1", [id]);
  await until(() => d.item(id), (r) => r?.future_field === "из новой версии", "строка с незнакомым полем приехала");

  await d.proto("editItem", id, { title: "Дюна 2" });
  await queueEmpty(d);
  expect(await serverItem(id)).toMatchObject({ title: "Дюна 2", future_field: "из новой версии" });
  expect((await d.item(id)).future_field).toBe("из новой версии");
  await d.kill();
});
