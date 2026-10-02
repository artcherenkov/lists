import { sha256, sitePath, type ChecksumEntry } from "./checksums.ts";
import { REQUEST_TIMEOUT_MS } from "./config.ts";
import {
  REVALIDATION_PROBES,
  assessSite,
  urlPathsForFile,
  type FileResponse,
  type SiteResponses,
  type Verdict,
} from "./verification.ts";

const SERVICE_WORKER = "sw.js";
const API_PROBE_PATH = "/api/probe";

/**
 * Запрашивает по HTTPS каждый файл релиза, `sw.js` с валидаторами и `/api/` и оценивает ответы.
 * `fetch` распаковывает сжатие сам, поэтому сумма считается по тому, что получил бы браузер.
 * Сетевая ошибка – исключение: сайт не ответил, а не ответил неверно.
 */
export async function verifySite(
  siteUrl: string,
  entries: ChecksumEntry[],
  signal?: AbortSignal,
): Promise<{
  verdict: Verdict;
  filesChecked: number;
}> {
  const files: FileResponse[] = [];
  for (const entry of entries) {
    const path = sitePath(entry);
    for (const urlPath of urlPathsForFile(path)) {
      const response = await request(siteUrl, urlPath, signal);
      files.push({
        path,
        urlPath,
        expectedSha256: entry.sha256,
        status: response.status,
        headers: Object.fromEntries(response.headers),
        bodySha256: sha256(new Uint8Array(await response.arrayBuffer())),
      });
    }
  }

  const revalidationProbes = [];
  for (const probe of REVALIDATION_PROBES) {
    const response = await request(siteUrl, "/" + SERVICE_WORKER, signal, probe.headers);
    await response.arrayBuffer();
    revalidationProbes.push({ name: probe.name, status: response.status });
  }

  const api = await request(siteUrl, API_PROBE_PATH, signal);
  await api.arrayBuffer();

  const responses: SiteResponses = { files, revalidationProbes, apiStatus: api.status };
  return { verdict: assessSite(responses), filesChecked: entries.length };
}

async function request(
  siteUrl: string,
  path: string,
  signal: AbortSignal | undefined,
  headers: Record<string, string> = {},
): Promise<Response> {
  const url = siteUrl + path;
  try {
    // Перенаправление не идём: ответ 301 на файл – нарушение, а не повод читать другой адрес.
    return await fetch(url, {
      redirect: "manual",
      headers,
      signal: AbortSignal.any([
        AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        ...(signal ? [signal] : []),
      ]),
    });
  } catch (error) {
    // Остановка операции – не отказ сайта.
    signal?.throwIfAborted();
    throw new Error(`Не удалось проверить сайт: запрос ${url} не получил ответа`, { cause: error });
  }
}
