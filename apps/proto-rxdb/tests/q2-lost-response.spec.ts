import { test, expect } from "@playwright/test";

import { admin, API, browserOf, Device, opsLog, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);
test.afterEach(async () => {
  await admin("/dev/fail", { loseResponses: 0 });
});

test("q2. повтор push после потерянного ответа не затирает чужую более позднюю правку", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user, extra: "retry=2500" }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const id = await A.p("addItem", { title: "T", rating: 1 });
  await queueEmpty(A);
  await until(
    () => B.item(id),
    (v) => !!v,
    15_000,
  );
  await opsLog();

  await admin("/dev/fail", { loseResponses: 1 });
  await A.p("updateItem", id, { rating: 3 });
  await until(
    () => pg("select rating from items where id=$1", [id]),
    (r) => r[0].rating === 3,
    10_000,
    "applied, response lost",
  );
  await B.p("updateItem", id, { rating: 5 }); // позже, с другого устройства
  await until(
    () => pg("select rating from items where id=$1", [id]),
    (r) => r[0].rating === 5,
    10_000,
    "B applied",
  );
  await until(
    () => A.item(id),
    (v) => v?.rating === 5,
    20_000,
    "A retried and converged",
  );
  expect((await pg("select rating from items where id=$1", [id]))[0].rating).toBe(5);
  const applied = (await opsLog()).filter((o) => o.id === id).map((o) => o.fields.join());
  console.log(`[${info.project.name}] применений на сервере:`, JSON.stringify(applied));
  expect(applied).toEqual(["rating,updated_at", "rating,updated_at"]); // A один раз и B один раз

  await A.kill();
  await B.kill();
});

test("q2б. повтор той же пачки после чужой правки: с ключом правка B цела, без ключа повтор её затирает", async ({}, info) => {
  test.skip(info.project.name === "webkit", "серверная проверка без браузера");
  const user = uid();
  const token = (await admin("/dev/token", { user })).token as string;
  const post = async (rows: unknown[]) =>
    (
      await fetch(`${API}/push/items`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "x-data-version": "3",
          "content-type": "application/json",
        },
        body: JSON.stringify({ rows }),
      })
    ).json();
  const id = uid("i");
  const base = {
    id,
    kind: "movie",
    title: "T",
    status: "want",
    rating: 1,
    added_at: "a",
    updated_at: "a",
    dv: 3,
  };
  await post([{ newDocumentState: base }]);
  const rating = async () => (await pg("select rating from items where id=$1", [id]))[0].rating;
  const aRow = {
    assumedMasterState: base,
    newDocumentState: { ...base, rating: 3, updated_at: "b" },
  };
  const bRow = {
    assumedMasterState: { ...base, rating: 3, updated_at: "b" },
    newDocumentState: { ...base, rating: 5, updated_at: "c" },
  };
  await post([aRow]);
  await post([bRow]);
  const retry = await post([aRow]); // ответ A потерялся, клиент прислал ту же пачку
  expect(await rating()).toBe(5);
  expect(retry.conflicts[0].rating).toBe(5); // A узнаёт состояние сервера
  await pg("delete from applied_pushes");
  await post([aRow]);
  expect(await rating()).toBe(3); // без ключа повтор считается новой правкой и затирает правку B
});
