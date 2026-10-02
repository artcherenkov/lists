import { describe, expect, it } from "vitest";

import { formatAppVersion } from "../app-version.ts";

describe("formatAppVersion", () => {
  it("показывает дату коммита и хеш из семи знаков", () => {
    const version = formatAppVersion({ date: "2026-10-02", hash: "d5c28ef", hasChanges: false });

    expect(version).toBe("2026-10-02 · d5c28ef");
  });

  it("обрезает полный хеш до семи знаков", () => {
    const version = formatAppVersion({
      date: "2026-10-02",
      hash: "d5c28ef1a2b3c4d5e6f708192a3b4c5d6e7f8091",
      hasChanges: false,
    });

    expect(version).toBe("2026-10-02 · d5c28ef");
  });

  it("помечает сборку с правками", () => {
    const version = formatAppVersion({ date: "2026-10-02", hash: "d5c28ef", hasChanges: true });

    expect(version).toBe("2026-10-02 · d5c28ef · с правками");
  });
});
