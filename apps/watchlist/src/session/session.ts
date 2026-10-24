import { writeJournal } from "../journal/journal.ts";
import { browserStorage } from "../storage/storage.ts";
import { watchBotUsername } from "./bot-username.ts";
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
 * Сверяет вход с сервером в фоне – при запуске и когда вернулась сеть – и следит за входом и
 * выходом в других вкладках; вызывается один раз при запуске, после журнала.
 */
export function startSession() {
  void store.check();
  // Без сети сверка при запуске ничего не узнала, а приложение может жить открытым днями.
  window.addEventListener("online", () => void store.check());
  // `key` – `null`, когда другая вкладка очистила хранилище целиком.
  window.addEventListener("storage", (event) => {
    if (event.key === ACCOUNT_KEY || event.key === null) store.reloadFromStorage();
  });
}

// Пока сервер не назвал бота, имя запрашивается снова: сервер мог перезапускаться, а сеть
// устройства – пропадать.
const BOT_RETRY_MS = 5000;

/** Следит за именем бота входа (без `@`), пока не получит его; возвращает остановку. */
export function watchLoginBot(handlers: {
  onName: (username: string) => void;
  onUnavailable: () => void;
}): () => void {
  return watchBotUsername({
    load: () => fetchBotUsername(globalThis.fetch.bind(globalThis)),
    retryMs: BOT_RETRY_MS,
    ...handlers,
  });
}
