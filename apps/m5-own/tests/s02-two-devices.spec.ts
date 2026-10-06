import { test } from "@playwright/test";

import { Device, until, uid } from "./helpers.ts";

test("2. правка с одного устройства приезжает на другое того же аккаунта без перезагрузки, в обе стороны", async ({}, info) => {
  const user = uid();
  const browser = info.project.name as "chromium";
  const [a, b] = [Device.create(browser, "A", { user }), Device.create(browser, "B", { user })];
  await a.start();
  await b.start();

  const id: string = await a.proto("createItem", { kind: "film", title: "Дюна" });
  await until(
    () => b.item(id),
    (r) => r?.title === "Дюна",
    "запись приехала на B",
  );

  await b.proto("editItem", id, { rating: 9 });
  await until(
    () => a.item(id),
    (r) => r?.rating === 9,
    "правка B приехала на A",
  );

  await a.proto("editItem", id, { status: "watched" });
  await until(
    () => b.item(id),
    (r) => r?.status === "watched" && r?.rating === 9,
    "правка A приехала на B",
  );
  await a.kill();
  await b.kill();
});
