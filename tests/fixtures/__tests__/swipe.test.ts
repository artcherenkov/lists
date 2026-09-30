import { expect, test } from "vitest";

import { swipeDownPath } from "../swipe.ts";

test("путь свайпа идёт вниз равными шагами и заканчивается на нужной дистанции", () => {
  const path = swipeDownPath({ x: 100, y: 200 }, 400, 4);

  expect(path).toEqual([
    { x: 100, y: 300 },
    { x: 100, y: 400 },
    { x: 100, y: 500 },
    { x: 100, y: 600 },
  ]);
});
