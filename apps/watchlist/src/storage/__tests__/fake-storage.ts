import type { KeyValueStorage } from "../storage.ts";

/** Хранилище в памяти: граница платформы, как `localStorage`. */
export function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: KeyValueStorage & { data: Map<string, string> } = {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
  return storage;
}

/** Хранилище, которое бросает на каждом обращении, как `localStorage` при запрете сайта. */
export const brokenStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("SecurityError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

/** Читается, но не пишется: переполненная квота. */
export function fullStorage(initial: Record<string, string> = {}) {
  return {
    ...memoryStorage(initial),
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  } satisfies KeyValueStorage;
}
