import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const SITE_PREFIX = "site/";
const LINE = /^([0-9a-f]{64}) {2}(site\/.+)$/;

export interface ChecksumEntry {
  /** Путь внутри релиза, например `site/assets/index-abc.js`. */
  path: string;
  sha256: string;
}

export function sha256(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

/** Формат `sha256sum`: хеш, два пробела, путь. Порядок – по пути, чтобы файл не зависел от обхода. */
export function formatChecksums(entries: ChecksumEntry[]): string {
  return [...entries]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((entry) => `${entry.sha256}  ${entry.path}\n`)
    .join("");
}

/** Читает `SHA256SUMS` релиза. Пустой или повреждённый файл – ошибка: по нему проверять нечего. */
export function parseChecksums(text: string): ChecksumEntry[] {
  const entries = text
    .split("\n")
    .filter((line) => line !== "")
    .map((line) => {
      const match = LINE.exec(line);
      if (!match) throw new Error(`Строка SHA256SUMS не в формате «хеш  site/путь»: ${line}`);
      return { sha256: match[1]!, path: match[2]! };
    });
  if (entries.length === 0) throw new Error("SHA256SUMS пуст");
  return entries;
}

/** Путь файла внутри `site/`: то, что видит браузер после корня сайта. */
export function sitePath(entry: ChecksumEntry): string {
  return entry.path.slice(SITE_PREFIX.length);
}

/** Суммы всех файлов каталога `siteDir`, пути – с префиксом `site/`. */
export async function computeChecksums(siteDir: string): Promise<ChecksumEntry[]> {
  const dirents = await readdir(siteDir, { recursive: true, withFileTypes: true });
  const files = dirents.filter((dirent) => dirent.isFile());
  return Promise.all(
    files.map(async (file) => {
      const absolute = join(file.parentPath, file.name);
      return {
        path: SITE_PREFIX + relative(siteDir, absolute),
        sha256: sha256(await readFile(absolute)),
      };
    }),
  );
}
