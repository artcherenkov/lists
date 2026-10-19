import { test, expect } from "@playwright/test";
import { admin, Device, pg, queueEmpty, uid, until } from "./helpers.ts";

const browserOf = (info: any) => info.project.name as "chromium" | "webkit";

test("10. сериал каталога приезжает, когда человек добавил запись, и уходит, когда удалил; правка каталога доходит", async ({}, info) => {
  const user = uid(), bob = uid("bob");
  const base = 100000 + Math.floor(Math.random() * 800000);
  const [s1, s2, s3] = [base, base + 1, base + 2].map(String);
  for (const [id, t] of [[s1, "Show 1"], [s2, "Show 2"], [s3, "Show 3"]])
    await pg("insert into shows(id,title,seasons_json,continuing) values($1,$2,'[]',1)", [id, t]);
  const A = Device.create(browserOf(info), "A", { user });
  const B = Device.create(browserOf(info), "B", { user });
  await A.start();
  await B.start();
  expect(await A.showIds()).toEqual([]);

  const i1 = await A.p("addItem", { kind: "series", title: "S1", tmdb_id: s1 });
  await until(() => A.showIds(), (ids) => ids.includes(s1), 20_000, "show 1 arrives after add");
  expect(await A.showIds()).toEqual([s1]); // чужие сериалы каталога не приезжают
  await until(() => B.showIds(), (ids) => ids.includes(s1), 20_000, "B gets show via other device item");

  // правка строки каталога на сервере доходит
  await pg("update shows set title='Show 1 renamed', continuing=0, seasons_json='[{\"n\":1}]' where id=$1", [s1]);
  await until(() => A.show(s1), (v) => v?.title === "Show 1 renamed" && v?.continuing === 0, 20_000, "catalog edit");

  // второй сериал и второй запись того же сериала
  const i2 = await A.p("addItem", { kind: "series", title: "S2", tmdb_id: s2 });
  const i1b = await A.p("addItem", { kind: "series", title: "S1 again", tmdb_id: s1 });
  await until(() => A.showIds(), (ids) => ids.includes(s2));
  // Боб с тем же сериалом
  const bobDev = Device.create(browserOf(info), "Bob", { user: bob });
  await bobDev.start();
  await bobDev.p("addItem", { kind: "series", title: "Bob S1", tmdb_id: s1 });
  await until(() => bobDev.showIds(), (ids) => ids.includes(s1), 20_000, "bob gets show");

  // удаление одной из двух записей сериала: сериал остаётся
  await A.p("updateItem", i1b, { deleted_at: new Date().toISOString() });
  await queueEmpty(A);
  await new Promise((r) => setTimeout(r, 1500));
  expect(await A.showIds()).toContain(s1);

  // удаление последней записи: сериал уходит с устройства (мягкое удаление), у Боба остаётся
  await A.p("updateItem", i1, { deleted_at: new Date().toISOString() });
  await queueEmpty(A);
  await until(() => A.showIds(), (ids) => !ids.includes(s1), 20_000, "show 1 leaves after delete");
  await until(() => B.showIds(), (ids) => !ids.includes(s1), 20_000, "B show leaves");
  expect(await bobDev.showIds()).toContain(s1);
  // «Отменить»: сериал возвращается
  await A.p("updateItem", i1, { deleted_at: null });
  await until(() => A.showIds(), (ids) => ids.includes(s1), 20_000, "show 1 back after undo");
  // запись добавлена на другом устройстве
  await B.p("addItem", { kind: "series", title: "S3", tmdb_id: s3 });
  await until(() => A.showIds(), (ids) => ids.includes(s3), 20_000, "A gets show from B's item");
  // жёсткое удаление
  await A.p("exec", "DELETE FROM items WHERE id = ?", [i2]);
  await queueEmpty(A);
  await until(() => A.showIds(), (ids) => !ids.includes(s2), 20_000, "show 2 leaves after hard delete");
  console.log(`[${info.project.name}] итог каталога на A:`, JSON.stringify(await A.showIds()));
  await A.kill(); await B.kill(); await bobDev.kill();
});
