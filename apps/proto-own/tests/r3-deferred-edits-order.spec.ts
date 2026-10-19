import { expect, test } from "@playwright/test";
import { admin, Device, queueEmpty, resetVersions, serverItem, sql, uid, until } from "./helpers.ts";

test.afterEach(resetVersions);

// data-model, «Ошибка шага»: правка, на которой упал шаг, и все более поздние правки той же записи откладываются
// до исправленной версии. Запись при этом видна и редактируется: упала только правка, не сама запись.
test("правка, сделанная после обновления, не обгоняет отложенную более раннюю правку той же записи", async ({}, info) => {
  const user = uid();
  await resetVersions();
  const a = Device.create(info.project.name as "chromium", "A", { user, dv: 1 });
  await a.start();
  const id: string = await a.proto("createItem", { kind: "film", title: "Дюна" });
  const marker: string = await a.proto("createItem", { kind: "film", title: "Маркер" });
  await queueEmpty(a);

  await a.offline();
  await a.proto("editItem", id, { note: "FAIL: старая заметка" }); // шаг 2→3 на этой правке упадёт

  await a.restart({ dv: 3, faultyStep: true });
  expect((await a.queue()).map((e) => [e.fields.note, e.v])).toEqual([["FAIL: старая заметка", 2]]);
  expect((await a.item(id)).dv).toBe(3); // запись переведена и видна

  await a.proto("editItem", id, { note: "новая заметка" }); // человек правит то же поле уже после обновления
  await admin("/admin/deploy", { to: 3 });
  await a.online();
  // Маркер приезжает, только когда после выхода в сеть прошёл целый цикл: сначала отправка всего, что можно отправить, потом загрузка.
  await sql("UPDATE items SET note = 'маркер' WHERE id = $1", [marker]);
  await until(() => a.item(marker), (r) => r?.note === "маркер", "после выхода в сеть прошёл цикл синхронизации");

  // Исправленная сборка: отложенная правка переводится и уходит.
  await a.restart({ dv: 3, faultyStep: false });
  await queueEmpty(a);
  expect((await serverItem(id)).note).toBe("новая заметка");
  await until(() => a.item(id), (r) => r.note === "новая заметка", "устройство сошлось с сервером");
  await a.kill();
});
