import { expect, test } from "@playwright/test";
import { admin, Device, queueEmpty, resetVersions, serverItem, sleep, sql, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);
const browserOf = (info: any) => info.project.name as "chromium";
const listed = (d: Device, page: any): Promise<string[]> =>
  page.evaluate(() => [...document.querySelectorAll("#list li")].map((li) => (li as HTMLElement).dataset.id!));

test("отправляет одна вкладка; закрыли её – лидером становится другая", async ({}, info) => {
  const d = Device.create(browserOf(info), "A", { user: uid() });
  await d.start();
  const [first, second] = [d.page, await d.newTab()];
  expect([(await d.status(first)).leader, (await d.status(second)).leader]).toEqual([true, false]);

  await first.close();
  await until(() => d.status(second), (s) => s.leader, "вторая вкладка стала лидером");
  const id: string = await d.protoOn(second, "createItem", { kind: "film", title: "Из второй вкладки" });
  await until(() => serverItem(id), (r) => !!r, "новый лидер отправляет");
  await d.kill();
});

test("запись из двух вкладок: обе правки в очереди и на сервере, каждая вкладка видит чужую", async ({}, info) => {
  const user = uid();
  const d = Device.create(browserOf(info), "A", { user });
  await d.start();
  const [t1, t2] = [d.page, await d.newTab()];
  await d.offline();

  const one: string = await d.protoOn(t1, "createItem", { kind: "film", title: "Из первой" });
  const two: string = await d.protoOn(t2, "createItem", { kind: "film", title: "Из второй" });
  await d.protoOn(t2, "editItem", one, { note: "вторая правит запись первой" });
  expect((await d.queue(t1)).map((e) => e.id)).toEqual([one, two, one]);
  // Вкладки узнают друг о друге через базу, без сети и без перезагрузки.
  await until(() => listed(d, t1), (ids) => ids.length === 2, "первая вкладка видит запись второй");
  await until(() => listed(d, t2), (ids) => ids.length === 2, "вторая вкладка видит запись первой");

  await d.online();
  await queueEmpty(d);
  expect(await serverItem(one)).toMatchObject({ title: "Из первой", note: "вторая правит запись первой" });
  expect(await serverItem(two)).toMatchObject({ title: "Из второй" });
  await d.kill();
});

test("старая вкладка рядом с переведённой копией не пишет, не отправляет чужие правки и не портит копию", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const d = Device.create(browserOf(info), "A", { user, dv: 1 });
  await d.start();
  const old = d.page;
  const id: string = await d.proto("createItem", { kind: "film", title: "Дюна", rating: 8 });
  await queueEmpty(d);

  const fresh = await d.newTab({ dv: 2 }); // новая сборка переводит копию, пока старая вкладка открыта
  expect(await d.item(id, fresh)).toMatchObject({ rating: 4, dv: 2 });

  await expect(d.protoOn(old, "createItem", { kind: "film", title: "Не должна записаться" })).rejects.toThrow(/нужно обновление/);
  await expect(d.protoOn(old, "editItem", id, { rating: 9 })).rejects.toThrow(/нужно обновление/);

  const mine: string = await d.protoOn(fresh, "createItem", { kind: "film", title: "Из новой вкладки", rating: 3 });
  await sql("UPDATE items SET note = 'с сервера' WHERE id = $1", [id]);
  await until(() => d.status(old), (s) => s.newerEdits && s.copyNewer, "старая вкладка видит правку новее себя и копию новее");
  await sleep(1000);
  expect(await serverItem(mine)).toBeUndefined(); // старая вкладка держит отправку, но чужую правку не шлёт
  expect(await d.item(id, fresh)).toMatchObject({ rating: 4, dv: 2, note: null }); // и не кладёт в копию строку старой формы

  await admin("/admin/deploy", { to: 2 }); // сервер выкатили на новую версию
  await old.close(); // закрыли старую вкладку – новая берёт отправку и загрузку
  d.page = fresh;
  await queueEmpty(d);
  expect(await serverItem(mine)).toMatchObject({ title: "Из новой вкладки" });
  await until(() => d.item(id, fresh), (r) => r.note === "с сервера", "загрузка пошла после закрытия старой вкладки");
  await d.kill();
});
