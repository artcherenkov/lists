import { afterEach, describe, expect, it } from "vitest";

import { browserStorage, writeText } from "../storage.ts";
import { brokenStorage, memoryStorage } from "./fake-storage.ts";

describe("browserStorage", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  afterEach(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("обращение к localStorage бросает (сайту запрещено хранилище): возвращает undefined", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new Error("SecurityError");
      },
    });
    expect(browserStorage()).toBeUndefined();
  });

  it("localStorage доступен: возвращает его", () => {
    const fake = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    Object.defineProperty(globalThis, "localStorage", { configurable: true, value: fake });
    expect(browserStorage()).toBe(fake);
  });
});

describe("writeText", () => {
  it("сообщает, удалась ли запись: удалась, хранилища нет, хранилище бросает", () => {
    const storage = memoryStorage();
    expect(writeText(storage, "k", "v")).toBe(true);
    expect(storage.data.get("k")).toBe("v");
    expect(writeText(undefined, "k", "v")).toBe(false);
    expect(writeText(brokenStorage, "k", "v")).toBe(false);
  });
});
