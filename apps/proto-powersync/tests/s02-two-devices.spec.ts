import { test, expect } from "@playwright/test";

import { Device, uid, until } from "./helpers.ts";

test("2. правка приезжает на другое устройство того же аккаунта в обе стороны", async ({}, info) => {
  const user = uid();
  const A = Device.create(info.project.name as any, "A", { user });
  const B = Device.create(info.project.name as any, "B", { user });
  await A.start();
  await B.start();
  const t0 = Date.now();
  const id = await A.p("addItem", { kind: "series", title: "Severance", tmdb_id: "9001" });
  await until(
    () => B.item(id),
    (v) => !!v,
    20_000,
    "B sees A item",
  );
  const a2b = Date.now() - t0;
  const t1 = Date.now();
  await B.p("updateItem", id, { rating: 9, status: "watching" });
  await until(
    () => A.item(id),
    (v) => v?.rating === 9 && v?.status === "watching",
    20_000,
    "A sees B edit",
  );
  const b2a = Date.now() - t1;
  // сезон туда и обратно
  await A.p("setSeason", id, 1, "watching");
  await until(
    () => B.season(`${id}:1`),
    (v) => v?.state === "watching",
  );
  await B.p("setSeason", id, 1, "watched");
  await until(
    () => A.season(`${id}:1`),
    (v) => v?.state === "watched",
  );
  console.log(`[${info.project.name}] A->B ${a2b} ms (с созданием), B->A ${b2a} ms`);
  await A.kill();
  await B.kill();
});
