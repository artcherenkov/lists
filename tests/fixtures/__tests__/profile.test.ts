import { expect, test } from "vitest";

import { VERSION_FORMAT } from "../profile.ts";

test.each(["2026-10-02 · d5c28ef", "2026-10-02 · d5c28ef · с правками"])(
  "номер версии «%s» подходит под формат",
  (version) => {
    expect(version).toMatch(VERSION_FORMAT);
  },
);

test.each([
  "",
  "dev",
  "2026-10-02",
  "2026-10-02 · d5c28e",
  "2026-10-02 · d5c28efa",
  "2026-10-02 · D5C28EF",
  "2026-10-02 · d5c28ef · ",
])("номер версии «%s» не подходит под формат", (version) => {
  expect(version).not.toMatch(VERSION_FORMAT);
});
