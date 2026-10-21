/**
 * Запросы входа к серверу: сессия, вход кодом, выход и имя бота (решение 6 вехи 6 – свой `fetch`
 * без клиента better-auth). Ответ сервера разбирается здесь, наружу уходит только итог.
 */

/** Вошедший человек: id аккаунта и имя из Telegram. */
export interface Account {
  id: string;
  name: string;
}

export type SessionCheck =
  | { kind: "signed-in"; account: Account }
  | { kind: "signed-out" }
  /** Нет сети, сервер не ответил или ответил не так, как отвечает на сессию. */
  | { kind: "unknown" };

export type SignInResult =
  | { kind: "signed-in"; account: Account }
  /** Неизвестный, просроченный и использованный код сервер не различает. */
  | { kind: "wrong-code" }
  /** `retryAfterSeconds` – когда сервер снова примет код с этого IP, если он это сообщил. */
  | { kind: "too-often"; retryAfterSeconds: number | null }
  | { kind: "no-connection" }
  | { kind: "server-error" };

type Fetch = typeof fetch;

const JSON_HEADERS = { "content-type": "application/json" };
// Зависший запрос не должен держать «Проверяем код» и «Выйти» бесконечно: после срока он –
// как обрыв связи.
const REQUEST_TIMEOUT_MS = 15_000;

function request(fetch: Fetch, path: string, init: RequestInit = {}) {
  return fetch(path, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

/** `undefined` вместо исключения: связь оборвалась на теле или ответ не JSON, например страница. */
async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Аккаунт из значения неизвестного вида: из ответа сервера или записи на устройстве. */
export function asAccount(value: unknown): Account | null {
  if (typeof value !== "object" || value === null) return null;
  if (!("id" in value) || typeof value.id !== "string") return null;
  if (!("name" in value) || typeof value.name !== "string") return null;
  return { id: value.id, name: value.name };
}

/** Аккаунт из ответа better-auth: `{ user: { id, name } }`. */
function accountFrom(body: unknown): Account | null {
  if (typeof body !== "object" || body === null || !("user" in body)) return null;
  return asAccount(body.user);
}

/**
 * Помнит ли сервер вход этого устройства. Выход – только явный ответ better-auth «сессии нет»
 * (`200` с `null`): ошибка сети или чужой ответ не должны выкидывать человека.
 */
export async function checkSession(fetch: Fetch): Promise<SessionCheck> {
  let response: Response;
  try {
    response = await request(fetch, "/api/auth/get-session");
  } catch {
    return { kind: "unknown" };
  }
  if (!response.ok) return { kind: "unknown" };
  const body = await readJson(response);
  if (body === null) return { kind: "signed-out" };
  const account = accountFrom(body);
  return account ? { kind: "signed-in", account } : { kind: "unknown" };
}

export async function requestSignIn(fetch: Fetch, code: string): Promise<SignInResult> {
  let response: Response;
  try {
    response = await request(fetch, "/api/auth/sign-in/telegram-code", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ code }),
    });
  } catch {
    return { kind: "no-connection" };
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("x-retry-after"));
    return {
      kind: "too-often",
      retryAfterSeconds: Number.isInteger(retryAfter) && retryAfter > 0 ? retryAfter : null,
    };
  }
  const body = await readJson(response);
  if (response.status === 400 && hasErrorCode(body, "WRONG_CODE")) return { kind: "wrong-code" };
  const account = response.ok ? accountFrom(body) : null;
  return account ? { kind: "signed-in", account } : { kind: "server-error" };
}

function hasErrorCode(body: unknown, code: string) {
  return typeof body === "object" && body !== null && "code" in body && body.code === code;
}

/** `true` – сервер забыл сессию и снял cookie. better-auth отвечает так и на выход без сессии. */
export async function requestSignOut(fetch: Fetch): Promise<boolean> {
  try {
    const response = await request(fetch, "/api/auth/sign-out", {
      method: "POST",
      headers: JSON_HEADERS,
      body: "{}",
    });
    return response.ok;
  } catch {
    return false;
  }
}

/** Имя бота входа без `@`; `null` – сервер недоступен. */
export async function fetchBotUsername(fetch: Fetch): Promise<string | null> {
  let response: Response;
  try {
    response = await request(fetch, "/api/telegram-bot");
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const body = await readJson(response);
  if (typeof body !== "object" || body === null || !("username" in body)) return null;
  return typeof body.username === "string" ? body.username : null;
}
