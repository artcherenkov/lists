import { expect, test } from "@playwright/test";

import { Device, queueEmpty, resetVersions, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

// data-model, «На устройстве после обновления»: окно старой версии, увидев копию новее себя, перестаёт писать.
// Отправка старого окна уже в пути, когда другое окно переводит копию: ответ сервера старая вкладка кладёт в копию
// строкой старой формы – список новой версии теряет запись до следующей перезагрузки.
// Условие задано задержкой ответа на `push` в старой вкладке (`page.route`): сервер правку принял, ответ приходит позже.
test("ответ на отправку старой вкладки не кладёт строку старой формы в копию, которую перевела новая", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const d = Device.create(info.project.name as "chromium", "A", { user, dv: 1 });
  await d.start();
  const old = d.page;
  const id: string = await d.proto("createItem", { kind: "film", title: "Дюна", rating: 8 });
  await queueEmpty(d);

  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  let answered!: () => void;
  const serverAnswered = new Promise<void>((resolve) => (answered = resolve));
  await old.route(/\/push$/, async (route) => {
    const response = await route.fetch();
    answered();
    await released;
    await route.fulfill({ response });
  });

  await d.protoOn(old, "editItem", id, { rating: 6 }); // шкала 1–10
  await serverAnswered; // сервер правку принял, ответ задержан

  const fresh = await d.newTab({ dv: 2 }); // новая сборка переводит копию и очередь: оценка 6 из 10 – это 3 звезды
  expect(await d.item(id, fresh)).toMatchObject({ rating: 3, dv: 2 });

  release();
  await until(
    () => d.queue(fresh),
    (q) => q.length === 0,
    "старая вкладка обработала ответ",
  );
  expect(await d.item(id, fresh)).toMatchObject({ rating: 3, dv: 2 });
  await d.kill();
});
