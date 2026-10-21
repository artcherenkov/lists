// Обращения к `localStorage` без исключений: сайту могут запретить данные, хранилище может
// переполниться. Им пользуются журнал и вход на устройстве.

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Само обращение к `localStorage` бросает, когда сайту запрещены данные. */
export function browserStorage(): KeyValueStorage | undefined {
  try {
    return localStorage;
  } catch {
    return undefined;
  }
}

/** `undefined` – хранилище недоступно; `null` – ключа нет. */
export function readText(storage: KeyValueStorage | undefined, key: string) {
  try {
    return storage?.getItem(key);
  } catch {
    return undefined;
  }
}

/** `false` – записать не удалось: хранилища нет, оно недоступно или переполнено. */
export function writeText(storage: KeyValueStorage | undefined, key: string, text: string) {
  if (!storage) return false;
  try {
    storage.setItem(key, text);
    return true;
  } catch {
    return false;
  }
}

export function removeKey(storage: KeyValueStorage | undefined, key: string) {
  try {
    storage?.removeItem(key);
  } catch {
    // Хранилище недоступно: удалять нечего.
  }
}
