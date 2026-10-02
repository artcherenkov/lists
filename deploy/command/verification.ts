/**
 * Оценка проверки сайта по HTTPS: чистые функции над уже полученными ответами. Сами запросы – в
 * `verify-site.ts`. Каждая функция возвращает причины провала; пустой список – годен.
 */

import { FIRST_DEPLOY_VERIFY_DEADLINE_MS, VERIFY_DEADLINE_MS } from "./config.ts";

const ASSETS_PREFIX = "assets/";
const INDEX_PAGE = "index.html";

/** Заголовки ответа с именами в нижнем регистре, как отдаёт `Headers` из `fetch`. */
export type ResponseHeaders = Record<string, string>;

export interface FileResponse {
  /** Путь внутри `site/`, например `assets/index-abc.js`. */
  path: string;
  /** Адрес, по которому запрошен файл, например `/assets/index-abc.js`; в причинах провала – он. */
  urlPath: string;
  /** Сумма файла из `SHA256SUMS` релиза. */
  expectedSha256: string;
  status: number;
  headers: ResponseHeaders;
  /** Сумма тела ответа после распаковки сжатия. */
  bodySha256: string;
}

/**
 * Запрос `sw.js` с валидаторами, которые совпали бы с любой версией файла: `*` подходит к любому
 * ETag, дата в будущем – к любому времени изменения. Настоящий устаревший валидатор взять неоткуда:
 * сервер их не выдаёт. Валидаторы идут отдельными запросами: если есть `If-None-Match`, сервер
 * `If-Modified-Since` не смотрит.
 */
export const REVALIDATION_PROBES = [
  { name: "If-None-Match", headers: { "if-none-match": "*" } },
  { name: "If-Modified-Since", headers: { "if-modified-since": "Fri, 01 Jan 2100 00:00:00 GMT" } },
] as const;

export type RevalidationProbeName = (typeof REVALIDATION_PROBES)[number]["name"];

export interface RevalidationProbeResponse {
  name: RevalidationProbeName;
  status: number;
}

/**
 * Ответы, полученные за одну попытку. Попытка могла оборваться на запросе без ответа, поэтому
 * списки бывают неполными, а `apiStatus` – `null`, если до `/api/` дело не дошло.
 */
export interface SiteResponses {
  files: FileResponse[];
  revalidationProbes: RevalidationProbeResponse[];
  apiStatus: number | null;
}

export type Verdict = { ok: true } | { ok: false; reasons: string[] };

/**
 * Адреса, по которым проверяется файл. Страница – и по `/` (так её открывает браузер), и по
 * `/index.html` (так её запрашивает предкеш Workbox): ответ у адресов отдельный, и проверяются
 * оба.
 */
export function urlPathsForFile(path: string): string[] {
  const url = "/" + path.split("/").map(encodeURIComponent).join("/");
  return path === INDEX_PAGE ? ["/", url] : [url];
}

export function assessFile(file: FileResponse): string[] {
  if (file.status !== 200) return [`${file.urlPath}: ответ ${file.status} вместо 200`];

  const reasons: string[] = [];
  if (file.bodySha256 !== file.expectedSha256) {
    reasons.push(`${file.urlPath}: содержимое не совпадает с суммой из SHA256SUMS`);
  }

  const cacheControl = cacheDirectives(file.headers["cache-control"]);
  if (file.path.startsWith(ASSETS_PREFIX)) {
    if (!cacheControl.includes("immutable")) {
      reasons.push(`${file.urlPath}: в Cache-Control нет immutable`);
    }
  } else {
    if (!cacheControl.includes("no-cache")) {
      reasons.push(`${file.urlPath}: в Cache-Control нет no-cache`);
    }
    if ("etag" in file.headers) reasons.push(`${file.urlPath}: ответ содержит ETag`);
    if ("last-modified" in file.headers)
      reasons.push(`${file.urlPath}: ответ содержит Last-Modified`);
  }

  if (
    file.path === INDEX_PAGE &&
    !(file.headers["x-robots-tag"] ?? "").toLowerCase().includes("noindex")
  ) {
    reasons.push(`${file.urlPath}: в X-Robots-Tag нет noindex`);
  }
  return reasons;
}

export function assessRevalidationProbe(probe: RevalidationProbeResponse): string[] {
  if (probe.status === 200) return [];
  return [`sw.js с устаревшим ${probe.name}: ответ ${probe.status} вместо 200`];
}

export function assessApiStatus(status: number): string[] {
  if (status === 404) return [];
  return [`/api/: ответ ${status} вместо 404`];
}

export function assessSite(site: SiteResponses): Verdict {
  const reasons = [
    ...site.files.flatMap(assessFile),
    ...site.revalidationProbes.flatMap(assessRevalidationProbe),
    ...(site.apiStatus === null ? [] : assessApiStatus(site.apiStatus)),
  ];
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

/**
 * Итог проверки сайта после включения релиза:
 * - `ok` – сайт отдаёт релиз как задумано;
 * - `rollback` – сайт ответил, и ответ неверен (содержимое, статус, заголовки): релиз возвращают;
 * - `unverified` – ответа не было (таймаут, обрыв, DNS, TLS): о релизе ничего не известно, его не
 *   трогают, а ошибка не должна откатывать исправный сайт из-за сети ноутбука.
 */
export type Assessment =
  | { kind: "ok" }
  | { kind: "rollback"; reasons: string[] }
  | { kind: "unverified"; reason: string };

/**
 * Оценка попытки. Неверный ответ главнее потерянного запроса: он уже получен, и повтор его не
 * исправит. `noResponse` – описание первого запроса, оставшегося без ответа, иначе `null`.
 */
export function assessAttempt(site: SiteResponses, noResponse: string | null): Assessment {
  const verdict = assessSite(site);
  if (!verdict.ok) return { kind: "rollback", reasons: verdict.reasons };
  if (noResponse !== null) return { kind: "unverified", reason: noResponse };
  return { kind: "ok" };
}

/**
 * Через сколько повторить запросы, если ответа не было, или `null`, если предельный срок вышел.
 * Последний повтор допустим ровно в срок.
 */
export function nextRetryDelayMs(input: {
  elapsedMs: number;
  deadlineMs: number;
  retryDelayMs: number;
}): number | null {
  return input.elapsedMs + input.retryDelayMs <= input.deadlineMs ? input.retryDelayMs : null;
}

/**
 * Сколько ждать ответа сайта. При первой выкладке (`current` ещё нет) Caddy выпускает сертификат:
 * на `cora` это заняло 6 с, но запас на повторы ACME и распространение DNS нужен больше обычного.
 */
export function verificationDeadlineMs(stateBefore: { current: string | null }): number {
  return stateBefore.current === null ? FIRST_DEPLOY_VERIFY_DEADLINE_MS : VERIFY_DEADLINE_MS;
}

function cacheDirectives(header: string | undefined): string[] {
  return (header ?? "")
    .split(",")
    .map((directive) => directive.split("=")[0]!.trim().toLowerCase());
}
