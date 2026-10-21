import { type KeyValueStorage, readText, removeKey, writeText } from "../storage/storage.ts";
import {
  type Account,
  asAccount,
  checkSession,
  requestSignIn,
  requestSignOut,
  type SignInResult,
} from "./server-api.ts";

export const ACCOUNT_KEY = "signed-in-account";

export interface SessionStore {
  /** Кто вошёл на этом устройстве; ссылка меняется только вместе с ним – подходит `useSyncExternalStore`. */
  account: () => Account | null;
  subscribe: (listener: () => void) => () => void;
  /** Сверяет вход устройства с сервером. Без ответа сервера вход остаётся прежним. */
  check: () => Promise<void>;
  /** Если ответ потерялся, а сервер впустил, вход восстановит сверка, но итогом останется ошибка. */
  signIn: (code: string) => Promise<SignInResult>;
  /** `false` – сервер не ответил, и человек остаётся вошедшим. */
  signOut: () => Promise<boolean>;
  /** Другая вкладка вошла или вышла: вход берётся из хранилища, которое она изменила. */
  reloadFromStorage: () => void;
}

const SIGN_IN_FAILURES: Record<Exclude<SignInResult["kind"], "signed-in">, string> = {
  "wrong-code": "неверный код",
  "too-often": "слишком много попыток",
  "no-connection": "нет связи с сервером",
  "server-error": "ошибка сервера",
};

/** Повреждённая запись – как её отсутствие: человек увидит экран входа. */
function parseAccount(raw: string | null | undefined): Account | null {
  if (!raw) return null;
  try {
    return asAccount(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Вход на устройстве (решение 6 вехи 6): последний ответ сервера о сессии лежит в хранилище, и
 * приложение открывается вошедшим без сети. Сервер – источник правды: при запуске `check`
 * сверяет с ним вход, в том числе когда записи на устройстве нет, а cookie сессии есть. В журнал
 * идут вход и выход без имени и id (решение 12).
 */
export function createSessionStore({
  storage,
  fetch,
  log,
}: {
  storage: KeyValueStorage | undefined;
  fetch: typeof globalThis.fetch;
  log: (text: string) => void;
}): SessionStore {
  const listeners = new Set<() => void>();
  let account = parseAccount(readText(storage, ACCOUNT_KEY));
  // Растёт с каждым входом и выходом, в том числе в другой вкладке: ответ о сессии, запрошенный
  // до них, устарел.
  let signChanges = 0;

  const set = (next: Account | null) => {
    if (next?.id === account?.id && next?.name === account?.name) return;
    account = next;
    if (next === null) removeKey(storage, ACCOUNT_KEY);
    else if (!writeText(storage, ACCOUNT_KEY, JSON.stringify(next))) {
      log("Вход не сохранён на устройстве: хранилище недоступно, после перезапуска – экран входа");
    }
    for (const listener of listeners) listener();
  };

  const check = async () => {
    const changesBefore = signChanges;
    const result = await checkSession(fetch);
    if (signChanges !== changesBefore || result.kind === "unknown") return;
    if (result.kind === "signed-out") {
      if (account) log("Сервер не помнит вход этого устройства: показан экран входа");
      set(null);
      return;
    }
    if (!account) log("Вход восстановлен: сервер помнит сессию этого устройства");
    set(result.account);
  };

  return {
    account: () => account,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    check,
    signIn: async (code) => {
      const result = await requestSignIn(fetch, code);
      if (result.kind === "signed-in") {
        signChanges += 1;
        log("Вход кодом из Telegram");
        set(result.account);
      } else {
        log(`Вход не удался: ${SIGN_IN_FAILURES[result.kind]}`);
        // Сервер мог впустить, а ответ – потеряться по дороге: код уже потрачен, но сессия есть.
        if (result.kind === "no-connection" || result.kind === "server-error") await check();
      }
      return result;
    },
    signOut: async () => {
      const forgotten = await requestSignOut(fetch);
      if (forgotten) {
        signChanges += 1;
        log("Выход из аккаунта");
        set(null);
      } else {
        log("Выход не удался: нет ответа сервера");
      }
      return forgotten;
    },
    reloadFromStorage: () => {
      signChanges += 1;
      set(parseAccount(readText(storage, ACCOUNT_KEY)));
    },
  };
}
