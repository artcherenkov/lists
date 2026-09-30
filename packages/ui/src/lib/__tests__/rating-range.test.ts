import { describe, expect, it } from "vitest";

import { formatRatingRange } from "../rating-range";

describe("formatRatingRange", () => {
  it("суженный диапазон пишет через короткое тире", () => {
    expect(formatRatingRange([6, 9])).toBe("6–9");
  });

  it("совпавшие края дают одно число", () => {
    expect(formatRatingRange([7, 7])).toBe("7");
  });

  it("весь диапазон пишет как любой другой", () => {
    expect(formatRatingRange([1, 10])).toBe("1–10");
  });
});
