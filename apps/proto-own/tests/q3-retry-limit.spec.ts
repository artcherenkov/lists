import { expect, test } from "@playwright/test";
import { admin, Device, queueEmpty, serverItem, sql, uid, until } from "./helpers.ts";

test.afterEach(() => admin("/admin/poison", { id: null }));

test("застрявшая правка снимается с очереди после предела повторов, чтение при этом идёт, остальные правки уходят", async ({}, info) => {
  const user = uid();
  const d = Device.create(info.project.name as "chromium", "A", { user, retry: 500, attempts: 4 });
  await d.start();
  const [x, y, z] = [
    await d.proto("createItem", { kind: "film", title: "X", rating: 3 }),
    await d.proto("createItem", { kind: "film", title: "Y" }),
    await d.proto("createItem", { kind: "film", title: "Z" }),
  ] as [string, string, string];
  await queueEmpty(d);

  await admin("/admin/poison", { id: x }); // обработчик падает на правках записи X
  await d.proto("editItem", x, { rating: 9 });
  await d.proto("editItem", y, { title: "Y2" });
  const attempts = () => d.queue().then((q) => q.find((e) => e.id === x)?.attempts);
  await until(attempts, (n) => (n ?? 0) >= 1, "правка X повторяется");

  // Пока X застряла, загрузка идёт, а правка Y ждёт её, чтобы не нарушить порядок.
  await sql("UPDATE items SET note = 'с сервера' WHERE id = $1", [z]);
  await until(() => d.item(z), (r) => r?.note === "с сервера", "чтение не остановилось");
  expect((await serverItem(y)).title).toBe("Y");

  await queueEmpty(d, 30_000);
  expect(await serverItem(y)).toMatchObject({ title: "Y2" });
  expect(await serverItem(x)).toMatchObject({ rating: 3 });
  const rejection = (await d.rejections())[0]!;
  expect(rejection).toMatchObject({ id: x, fields: { rating: 9 } });
  expect(rejection.error).toContain("не ушла за 4 попыток");
  expect((await d.item(x)).rating).toBe(3); // откатилась к серверной
  await d.kill();
});
