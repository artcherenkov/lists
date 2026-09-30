import type { SampleItem } from "../sample-items.ts";

import { describe, expect, it } from "vitest";

import { searchSampleCatalog } from "../sample-catalog.ts";
import {
  applyItemPatch,
  countChangedFilters,
  DEFAULT_FILTERS,
  itemsOfTab,
  newItemFromDraft,
  statusOptionsFor,
  toPosterCardView,
} from "../views.ts";

function sampleItem(fields: Partial<SampleItem> = {}): SampleItem {
  return {
    id: "item-1",
    title: "Кольцо холмов",
    kind: "movie",
    status: "want",
    manual: false,
    deleted: false,
    ...fields,
  };
}

describe("toPosterCardView", () => {
  it("у фильма подзаголовок содержит год, у сериала – нет", () => {
    const movie = toPosterCardView(sampleItem({ year: 2019 }));
    const series = toPosterCardView(sampleItem({ kind: "series", year: 2021 }));

    expect(movie.subtitle).toBe("Фильм · 2019 · Хочу");
    expect(series.subtitle).toBe("Сериал · Хочу");
  });

  it("оценка становится плашкой, её отсутствие – нет", () => {
    expect(toPosterCardView(sampleItem({ rating: 8 })).badge).toBe("8");
    expect(toPosterCardView(sampleItem()).badge).toBeUndefined();
  });

  it("песочные часы – только у записи со статусом «Жду сезон»", () => {
    const waiting = toPosterCardView(sampleItem({ kind: "series", status: "waiting" }));

    expect(waiting.waitingLabel).toBe("Жду сезон");
    expect(toPosterCardView(sampleItem()).waitingLabel).toBeUndefined();
  });
});

describe("statusOptionsFor", () => {
  it("«Жду сезон» предлагается только сериалу", () => {
    const labels = (kind: "movie" | "series") => statusOptionsFor(kind).map(({ label }) => label);

    expect(labels("series")).toEqual(["Хочу", "Смотрю", "Посмотрел", "Жду сезон"]);
    expect(labels("movie")).toEqual(["Хочу", "Смотрю", "Посмотрел"]);
  });
});

describe("itemsOfTab", () => {
  const items = [
    sampleItem({ id: "a", status: "want" }),
    sampleItem({ id: "b", status: "watched" }),
    sampleItem({ id: "c", status: "want", deleted: true }),
  ];
  const ids = (tab: string) => itemsOfTab(items, tab).map(({ id }) => id);

  it("вкладка отбирает записи по статусу, «Все» – все", () => {
    expect(ids("want")).toEqual(["a"]);
    expect(ids("all")).toEqual(["a", "b"]);
  });

  it("удалённая запись не показывается ни на одной вкладке", () => {
    expect(ids("want")).not.toContain("c");
    expect(ids("all")).not.toContain("c");
  });
});

describe("countChangedFilters", () => {
  it("значение по умолчанию – ноль, каждое отличие – плюс один", () => {
    expect(countChangedFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countChangedFilters({ ...DEFAULT_FILTERS, kind: "series" })).toBe(1);
    expect(countChangedFilters({ kind: "series", rating: [3, 10] })).toBe(2);
  });
});

describe("applyItemPatch", () => {
  it("применяет название, тип и статус", () => {
    const patched = applyItemPatch(sampleItem(), {
      title: "Новое",
      kind: "series",
      status: "watching",
    });

    expect(patched).toMatchObject({ title: "Новое", kind: "series", status: "watching" });
  });

  it("неизвестный тип и статус отбрасывает", () => {
    const item = sampleItem({ status: "watched" });

    expect(applyItemPatch(item, { kind: "book", status: "reading" })).toEqual(item);
  });

  it("при смене сериала на фильм «Жду сезон» возвращается в «Хочу»", () => {
    const waitingSeries = sampleItem({ kind: "series", status: "waiting" });

    expect(applyItemPatch(waitingSeries, { kind: "movie" }).status).toBe("want");
  });
});

describe("newItemFromDraft", () => {
  it("записи, заведённой руками, не хватает года и постера", () => {
    expect(newItemFromDraft({ title: "Архив", kind: "series" })).toEqual({
      title: "Архив",
      kind: "series",
      manual: true,
    });
  });

  it("неизвестный тип считается ошибкой", () => {
    expect(() => newItemFromDraft({ title: "Архив", kind: "book" })).toThrow("book");
  });
});

describe("searchSampleCatalog", () => {
  it("находит по части названия без учёта регистра", async () => {
    const found = await searchSampleCatalog("звёздн", new AbortController().signal);

    expect(found.map(({ title }) => title)).toEqual(["Звёздный ветер", "Звёздная пыль севера"]);
  });

  it("отменённый запрос отклоняется", async () => {
    const controller = new AbortController();
    const search = searchSampleCatalog("звёздн", controller.signal);

    controller.abort();

    await expect(search).rejects.toBeDefined();
  });
});
