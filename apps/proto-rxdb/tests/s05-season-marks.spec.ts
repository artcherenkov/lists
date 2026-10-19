import { test, expect } from "@playwright/test";
import { browserOf, Device, pg, queueEmpty, uid, until } from "./helpers.ts";
import { atCurrent } from "./setup.ts";

test.beforeEach(atCurrent);

test("5. отметка сезона с двух устройств – одна строка; правка после удаления не теряется", async ({}, info) => {
  const user = uid();
  const A = await Device.create(browserOf(info), "A", { user }).start();
  const B = await Device.create(browserOf(info), "B", { user }).start();
  const show = await A.p("addItem", { kind: "series", title: "S" });
  await until(() => B.item(show), (v) => !!v, 15_000);
  await queueEmpty(A);
  await A.offline();
  await B.offline();
  await A.p("setSeason", show, 1, "watching");
  await B.p("setSeason", show, 1, "watched");
  await A.online();
  await queueEmpty(A);
  await B.online();
  await queueEmpty(B);
  const rows = await pg("select id, state, deleted from seasons where item_id=$1", [show]);
  expect(rows).toEqual([{ id: `${show}:1`, state: "watched", deleted: false }]);
  await until(() => A.p("season", `${show}:1`), (v) => v?.state === "watched", 15_000, "A sees watched");

  // A снимает отметку, B (ещё не знает) правит её: правка не теряется
  await B.offline();
  await A.p("clearSeason", show, 1);
  await until(() => pg("select deleted from seasons where id=$1", [`${show}:1`]), (r) => r[0]?.deleted === true, 15_000, "delete reached server");
  await B.p("setSeason", show, 1, "watching");
  await B.online();
  await queueEmpty(B);
  expect((await pg("select state, deleted from seasons where id=$1", [`${show}:1`]))[0]).toEqual({ state: "watching", deleted: false });
  await until(() => A.p("season", `${show}:1`), (v) => v?.state === "watching", 15_000, "A sees revived mark");
  await A.kill();
  await B.kill();
});
