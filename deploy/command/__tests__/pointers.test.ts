import { describe, expect, it } from "vitest";

import {
  assertCommitHash,
  parsePointerState,
  planDeploy,
  planReturn,
  pointersAfterDeploy,
} from "../pointers.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);
const C = "c".repeat(40);

describe("переходы указателей при выкладке", () => {
  it("новый релиз становится текущим, а прежний текущий – previous", () => {
    expect(pointersAfterDeploy({ current: A, previous: B }, C)).toEqual({
      current: C,
      previous: A,
    });
  });

  it("релиз, лежащий на сервере как previous, включается, а текущий уходит в previous", () => {
    expect(pointersAfterDeploy({ current: A, previous: B }, B)).toEqual({
      current: B,
      previous: A,
    });
  });

  it("выкладка текущего релиза ничего не меняет", () => {
    expect(pointersAfterDeploy({ current: A, previous: B }, A)).toEqual({
      current: A,
      previous: B,
    });
  });

  it("выкладка текущего релиза без previous оставляет previous пустым", () => {
    expect(pointersAfterDeploy({ current: A, previous: null }, A)).toEqual({
      current: A,
      previous: null,
    });
  });

  it("первая выкладка: current появляется, previous нет", () => {
    expect(pointersAfterDeploy({ current: null, previous: null }, A)).toEqual({
      current: A,
      previous: null,
    });
  });
});

describe("план выкладки", () => {
  it("релиза нет на сервере: нужны сборка и переключение", () => {
    expect(
      planDeploy({ state: { current: A, previous: null }, release: B, releaseOnServer: false }),
    ).toEqual({
      deliver: true,
      switchPointers: true,
      recordActivation: true,
      next: { current: B, previous: A },
    });
  });

  it("релиз лежит на сервере: без сборки, с переключением", () => {
    expect(
      planDeploy({ state: { current: A, previous: B }, release: B, releaseOnServer: true }),
    ).toEqual({
      deliver: false,
      switchPointers: true,
      recordActivation: true,
      next: { current: B, previous: A },
    });
  });

  it("релиз уже текущий: ни сборки, ни переключения, указатели те же", () => {
    expect(
      planDeploy({ state: { current: A, previous: B }, release: A, releaseOnServer: true }),
    ).toEqual({
      deliver: false,
      switchPointers: false,
      recordActivation: false,
      next: { current: A, previous: B },
    });
  });

  it("первая выкладка: сборка и переключение, возвращаться некуда", () => {
    expect(
      planDeploy({ state: { current: null, previous: null }, release: A, releaseOnServer: false }),
    ).toEqual({
      deliver: true,
      switchPointers: true,
      recordActivation: true,
      next: { current: A, previous: null },
    });
  });
});

describe("возврат после неудачной выкладки", () => {
  it("оба указателя – как до выкладки, а не поменянные местами", () => {
    expect(planReturn({ current: A, previous: B })).toEqual({
      target: { current: A, previous: B },
      recordActivation: true,
    });
  });

  it("previous не было – его и не будет", () => {
    expect(planReturn({ current: A, previous: null })?.target).toEqual({
      current: A,
      previous: null,
    });
  });

  it("первая выкладка: возвращаться некуда", () => {
    expect(planReturn({ current: null, previous: null })).toBeNull();
  });
});

describe("состояние указателей с сервера", () => {
  it("читает обе ссылки", () => {
    expect(parsePointerState(`current=releases/${A}\nprevious=releases/${B}\n`)).toEqual({
      current: A,
      previous: B,
    });
  });

  it("отсутствующая ссылка – null", () => {
    expect(parsePointerState("current=\nprevious=\n")).toEqual({ current: null, previous: null });
  });

  it("ссылка не на релиз – ошибка, а не догадка", () => {
    expect(() => parsePointerState(`current=/etc\nprevious=\n`)).toThrow(/current/);
  });

  it.each([A, "releases/abc1234", `releases/${A}/site`])(
    "цель «%s» – не каталог релиза: ошибка",
    (target) => {
      expect(() => parsePointerState(`current=${target}\nprevious=\n`)).toThrow(/current/);
    },
  );

  it("нет строки одной из ссылок – ошибка", () => {
    expect(() => parsePointerState(`current=releases/${A}\n`)).toThrow(/previous/);
  });
});

describe("хеш коммита для команд на сервере", () => {
  it("полный хеш подходит", () => {
    expect(() => assertCommitHash(A)).not.toThrow();
  });

  it.each(["abc1234", `${A}; rm -rf /`, "A".repeat(40), ""])("«%s» не подходит", (value) => {
    expect(() => assertCommitHash(value)).toThrow(/хеш коммита/);
  });
});
