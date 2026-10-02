import { describe, expect, it } from "vitest";

import { StoppedError } from "../cancellation.ts";
import { stopReason, stopReasonOfAbort } from "../errors.ts";

function abortError(): Error {
  const error = new Error("The operation was aborted");
  error.name = "AbortError";
  return error;
}

describe("причина остановки", () => {
  it("сигнал остановлен с причиной – это она", () => {
    const controller = new AbortController();
    controller.abort(new StoppedError());

    expect(stopReason(controller.signal)).toBeInstanceOf(StoppedError);
  });

  it("сигнал остановлен без причины – причины нет: его reason – безымянный AbortError", () => {
    const controller = new AbortController();
    controller.abort();

    expect(stopReason(controller.signal)).toBeUndefined();
  });

  it("сигнал не остановлен или его нет – причины нет", () => {
    expect(stopReason(new AbortController().signal)).toBeUndefined();
    expect(stopReason(undefined)).toBeUndefined();
  });

  it("прерывание команды сигналом с причиной даёт причину", () => {
    const controller = new AbortController();
    controller.abort(new StoppedError());

    expect(stopReasonOfAbort(abortError(), controller.signal)).toBeInstanceOf(StoppedError);
  });

  it("другая ошибка команды причиной остановки не подменяется, даже если сигнал уже остановлен", () => {
    const controller = new AbortController();
    controller.abort(new StoppedError());

    expect(stopReasonOfAbort(new Error("spawn ENOENT"), controller.signal)).toBeUndefined();
  });
});
