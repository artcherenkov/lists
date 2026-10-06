import { expect, test } from "@playwright/test";

import { admin, Device, queueEmpty, resetVersions, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

// Повторное ревью исправления F4. r4 проверяет принятую правку; здесь сервер правку отклонил. Старая вкладка не может записать
// откат в копию, которую перевела новая, и не должна потерять отказ: человек узнаёт о нём, правка откатывается, когда
// отправку берёт новая вкладка. Условие задано задержкой ответа на `push` в старой вкладке (`page.route`), как в r4.
test("отказ сервера в ответе, пришедшем в старую вкладку после перевода копии, не теряется", async ({}, info) => {
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

  await d.protoOn(old, "editItem", id, { rating: 99 }); // шкала версии 1 – 1–10: сервер отклонит
  await serverAnswered;

  const fresh = await d.newTab({ dv: 2 }); // перевод копии и очереди: оценка 99 из 10 – это 50 звёзд
  expect(await d.item(id, fresh)).toMatchObject({ rating: 50, dv: 2 });

  release();
  await until(
    () => d.status(old),
    (s) => s.copyNewer,
    "старая вкладка получила отказ уже при копии новее себя",
  );
  await admin("/admin/deploy", { to: 2 });
  await old.close(); // отправку берёт новая вкладка
  d.page = fresh;

  await queueEmpty(d);
  expect(await d.rejections()).toHaveLength(1); // человек узнал об отказе, и ровно один раз
  expect(await d.item(id, fresh)).toMatchObject({ rating: 4, dv: 2 }); // правка откатилась к состоянию сервера
  await d.kill();
});
