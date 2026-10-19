import { test, expect } from "@playwright/test";

import { admin, browserOf, Device, opsLog, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("4. правка уходит полями; разные поля сохраняются, одно поле – последнее; чужое поле не затирается", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const id = await A.p("addItem", { title: "T" });
  await until(
    () => B.item(id),
    (v) => !!v,
    15_000,
  );
  await queueEmpty(A);
  await pg("update items set future_field = 'FUTURE' where id = $1", [id]);
  await opsLog();

  await A.offline();
  await B.offline();
  await A.p("updateItem", id, { rating: 3 });
  await B.p("updateItem", id, { note: "from B" });
  await A.online();
  await queueEmpty(A);
  await B.online();
  await queueEmpty(B);
  const row = (await pg("select rating, note, future_field from items where id=$1", [id]))[0];
  expect(row).toEqual({ rating: 3, note: "from B", future_field: "FUTURE" });
  const ops = (await opsLog()).filter((o) => !o.creating);
  console.log(`[${info.project.name}] поля на сервер:`, JSON.stringify(ops.map((o) => o.fields)));
  expect(ops.map((o) => o.fields)).toEqual([
    ["rating", "updated_at"],
    ["note", "updated_at"],
  ]);
  await until(
    () => A.item(id),
    (v) => v?.note === "from B" && v?.rating === 3,
    15_000,
    "A merged",
  );
  await until(
    () => B.item(id),
    (v) => v?.rating === 3 && v?.note === "from B",
    15_000,
    "B merged",
  );

  // одно поле: последнее пришедшее на сервер
  await A.offline();
  await B.offline();
  await A.p("updateItem", id, { title: "Title A" });
  await B.p("updateItem", id, { title: "Title B" });
  await B.online();
  await queueEmpty(B);
  await A.online();
  await queueEmpty(A);
  expect((await pg("select title from items where id=$1", [id]))[0].title).toBe("Title A");
  await until(
    () => B.item(id),
    (v) => v?.title === "Title A",
    15_000,
    "B converged",
  );
  await A.kill();
  await B.kill();
});
