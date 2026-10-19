import { expect, test } from "@playwright/test";

import { Device, queueEmpty, sql, uid, until } from "./helpers.ts";

const browserOf = (info: any) => info.project.name as "chromium";

async function twoDevicesWithSeries(info: any) {
  const user = uid();
  const [a, b] = [
    Device.create(browserOf(info), "A", { user }),
    Device.create(browserOf(info), "B", { user }),
  ];
  await a.start();
  await b.start();
  const item: string = await a.proto("createItem", {
    kind: "series",
    title: "Сериал",
    tmdb_id: "9001",
  });
  await until(
    () => b.item(item),
    (r) => !!r,
    "сериал приехал на B",
  );
  await queueEmpty(a);
  return { a, b, item };
}
const marks = (item: string) =>
  sql("SELECT id, season, state FROM seasons WHERE item_id = $1 ORDER BY season", [item]);

test("5a. отметка сезона с двух устройств попадает в одну строку", async ({}, info) => {
  const { a, b, item } = await twoDevicesWithSeries(info);
  await a.offline();
  await b.offline();
  await a.proto("markSeason", item, 1, "watching");
  await b.proto("markSeason", item, 1, "watched");
  await b.proto("markSeason", item, 2, "watched");
  await a.online();
  await queueEmpty(a);
  await b.online();
  await queueEmpty(b);

  expect(await marks(item)).toEqual([
    { id: `${item}:1`, season: 1, state: "watched" },
    { id: `${item}:2`, season: 2, state: "watched" },
  ]);
  await until(
    () => a.season(`${item}:2`),
    (r) => r?.state === "watched",
    "A получило отметку второго сезона",
  );
  await a.kill();
  await b.kill();
});

test("5b. правка отметки после её снятия на другом устройстве не теряется молча", async ({}, info) => {
  const { a, b, item } = await twoDevicesWithSeries(info);
  await a.proto("markSeason", item, 1, "watching");
  await queueEmpty(a);
  await until(
    () => b.season(`${item}:1`),
    (r) => r?.state === "watching",
    "отметка приехала на B",
  );

  await b.offline();
  await a.proto("markSeason", item, 1, null);
  await queueEmpty(a);
  await b.proto("markSeason", item, 1, "watched"); // B ещё не знает о снятии
  await b.online();
  await queueEmpty(b);

  expect(await marks(item)).toEqual([{ id: `${item}:1`, season: 1, state: "watched" }]);
  await until(
    () => a.season(`${item}:1`),
    (r) => r?.state === "watched",
    "A получило отметку после снятия",
  );
  await a.kill();
  await b.kill();
});
