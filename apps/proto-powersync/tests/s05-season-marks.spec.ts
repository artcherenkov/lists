import { test, expect } from "@playwright/test";

import { admin, Device, pg, queueEmpty, uid, until } from "./helpers.ts";

test.afterEach(async () => {
  await admin("/admin/fail", { mode: "none" });
});
const browserOf = (info: any) => info.project.name as "chromium" | "webkit";

test("5. отметка сезона с двух устройств – одна строка; правка после удаления не теряется", async ({}, info) => {
  const user = uid();
  const A = Device.create(browserOf(info), "A", { user });
  const B = Device.create(browserOf(info), "B", { user });
  await A.start();
  await B.start();
  const id = await A.p("addItem", { kind: "series", title: "S", tmdb_id: "5001" });
  await until(
    () => B.item(id),
    (v) => !!v,
  );
  await queueEmpty(A);
  await A.offline();
  await B.offline();
  await A.p("setSeason", id, 1, "watching");
  await B.p("setSeason", id, 1, "watched");
  await A.online();
  await queueEmpty(A);
  await B.online();
  await queueEmpty(B);
  const rows = await until(
    () => pg("select id,state from seasons where item_id=$1", [id]),
    (r) => r.length === 1 && r[0].state === "watched",
    20_000,
    "one row",
  );
  expect(rows[0].id).toBe(`${id}:1`);
  await until(
    () => A.season(`${id}:1`),
    (v) => v?.state === "watched",
    20_000,
    "A converges",
  );

  // правка отметки после её удаления на другом устройстве
  await B.offline();
  await B.p("setSeason", id, 1, "watching"); // PATCH
  expect((await B.crud())[0].op).toBe("PATCH");
  await A.p("clearSeason", id, 1); // DELETE дошёл до сервера
  await queueEmpty(A);
  await until(
    () => pg("select 1 from seasons where id=$1", [`${id}:1`]),
    (r) => r.length === 0,
    20_000,
    "deleted on server",
  );
  await B.online();
  await queueEmpty(B);
  const after = await until(
    () => pg("select state from seasons where id=$1", [`${id}:1`]),
    (r) => r.length === 1,
    20_000,
    "edit not lost",
  );
  expect(after[0].state).toBe("watching");
  await until(
    () => A.season(`${id}:1`),
    (v) => v?.state === "watching",
    20_000,
    "A sees recreated",
  );
  await A.kill();
  await B.kill();
});
