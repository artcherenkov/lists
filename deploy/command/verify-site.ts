import { setTimeout } from "node:timers/promises";

import { sha256, sitePath, type ChecksumEntry } from "./checksums.ts";
import { REQUEST_TIMEOUT_MS } from "./config.ts";
import {
  REVALIDATION_PROBES,
  assessAttempt,
  nextRetryDelayMs,
  urlPathsForFile,
  type Assessment,
  type FileResponse,
  type RevalidationProbeResponse,
  type SiteResponses,
} from "./verification.ts";

const SERVICE_WORKER = "sw.js";
const API_PROBE_PATH = "/api/probe";

export interface VerifyOptions {
  /** Сколько повторять проходы, если сайт не отвечает. */
  deadlineMs: number;
  /** Пауза между проходами. */
  retryDelayMs: number;
  /** Мягкая остановка и потеря блокировки: прерывает и запрос, и паузу. */
  signal?: AbortSignal;
  /** Вызывается перед паузой: сайт не ответил, проход будет повторён. */
  onRetry?: (info: { attempt: number; reason: string; delayMs: number }) => void;
}

export interface VerifyResult {
  assessment: Assessment;
  filesChecked: number;
  attempts: number;
}

/**
 * Проверяет сайт, пока он не ответит. Каждый проход запрашивает по HTTPS каждый файл релиза, `sw.js`
 * с валидаторами и `/api/` и оценивает ответы (`assessAttempt`). Верный и неверный ответы
 * завершают проверку сразу, без повторов. Если ответа не было, проход повторяется через
 * `retryDelayMs` до предельного срока, потом итог – `unverified`.
 * `fetch` распаковывает сжатие сам, поэтому сумма считается по тому, что получил бы браузер.
 * Остановка операции – исключение с её причиной: это не отказ сайта.
 */
export async function verifySite(
  siteUrl: string,
  entries: ChecksumEntry[],
  options: VerifyOptions,
): Promise<VerifyResult> {
  const startedAt = Date.now();
  for (let attempts = 1; ; attempts += 1) {
    const { site, noResponse } = await attempt(siteUrl, entries, options.signal);
    const assessment = assessAttempt(site, noResponse);
    const result = { assessment, filesChecked: entries.length, attempts };
    if (assessment.kind !== "unverified") return result;

    const delayMs = nextRetryDelayMs({
      elapsedMs: Date.now() - startedAt,
      deadlineMs: options.deadlineMs,
      retryDelayMs: options.retryDelayMs,
    });
    if (delayMs === null) return result;
    options.onRetry?.({ attempt: attempts, reason: assessment.reason, delayMs });
    await pause(delayMs, options.signal);
  }
}

/** Один проход. Запрос без ответа обрывает его: что отвечает сайт дальше, уже не важно. */
async function attempt(
  siteUrl: string,
  entries: ChecksumEntry[],
  signal: AbortSignal | undefined,
): Promise<{ site: SiteResponses; noResponse: string | null }> {
  const files: FileResponse[] = [];
  const revalidationProbes: RevalidationProbeResponse[] = [];
  const site: SiteResponses = { files, revalidationProbes, apiStatus: null };
  try {
    for (const entry of entries) {
      const path = sitePath(entry);
      for (const urlPath of urlPathsForFile(path)) {
        const { response, body } = await request(siteUrl, urlPath, signal);
        files.push({
          path,
          urlPath,
          expectedSha256: entry.sha256,
          status: response.status,
          headers: Object.fromEntries(response.headers),
          bodySha256: sha256(body),
        });
      }
    }
    for (const probe of REVALIDATION_PROBES) {
      const { response } = await request(siteUrl, "/" + SERVICE_WORKER, signal, probe.headers);
      revalidationProbes.push({ name: probe.name, status: response.status });
    }
    site.apiStatus = (await request(siteUrl, API_PROBE_PATH, signal)).response.status;
    return { site, noResponse: null };
  } catch (error) {
    if (error instanceof NoResponseError) return { site, noResponse: error.message };
    throw error;
  }
}

class NoResponseError extends Error {
  constructor(url: string, options: ErrorOptions) {
    super(`запрос ${url} не получил ответа`, options);
    this.name = "NoResponseError";
  }
}

/** Ответ вместе с телом: обрыв посреди тела – тоже «ответа не было». */
async function request(
  siteUrl: string,
  path: string,
  signal: AbortSignal | undefined,
  headers: Record<string, string> = {},
): Promise<{ response: Response; body: Uint8Array }> {
  const url = siteUrl + path;
  try {
    // Перенаправление не идём: ответ 301 на файл – нарушение, а не повод читать другой адрес.
    const response = await fetch(url, {
      redirect: "manual",
      headers,
      signal: AbortSignal.any([
        AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...(signal ? [signal] : []),
      ]),
    });
    return { response, body: new Uint8Array(await response.arrayBuffer()) };
  } catch (error) {
    // Остановка операции – не отказ сайта.
    signal?.throwIfAborted();
    throw new NoResponseError(url, { cause: error });
  }
}

/** Пауза, которую прерывает остановка: ошибка – её причина. */
async function pause(ms: number, signal: AbortSignal | undefined): Promise<void> {
  try {
    await setTimeout(ms, undefined, { signal });
  } catch (error) {
    signal?.throwIfAborted();
    throw error;
  }
}
