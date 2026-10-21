import { writeJournal } from "../journal/journal.ts";
import { browserStorage } from "../storage/storage.ts";
import { fetchBotUsername } from "./server-api.ts";
import { ACCOUNT_KEY, createSessionStore } from "./store.ts";

export type { Account, SignInResult } from "./server-api.ts";

const store = createSessionStore({
  storage: browserStorage(),
  fetch: globalThis.fetch.bind(globalThis),
  log: writeJournal,
});

/** Кто вошёл на этом устройстве, `null` – никто. */
export const getAccount = store.account;
export const subscribeAccount = store.subscribe;
export const signIn = store.signIn;
export const signOut = store.signOut;

/**
 * Сверяет вход с сервером в фоне и следит за входом и выходом в других вкладках; вызывается один
 * раз при запуске, после журнала.
 */
export function startSession() {
  void store.check();
  // `key` – `null`, когда другая вкладка очистила хранилище целиком.
  window.addEventListener("storage", (event) => {
    if (event.key === ACCOUNT_KEY || event.key === null) store.reloadFromStorage();
  });
}

/** Имя бота входа без `@`; `null` – сервер недоступен. */
export const loadBotUsername = () => fetchBotUsername(globalThis.fetch.bind(globalThis));
