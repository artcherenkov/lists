const HASH_LENGTH = 7;

export interface CommitInfo {
  /** Дата коммита `YYYY-MM-DD`. */
  date: string;
  /** Полный или сокращённый хеш коммита. */
  hash: string;
  /** Изменены отслеживаемые файлы: сборка не совпадает с коммитом. */
  hasChanges: boolean;
}

/**
 * Номер версии для показа, например «2026-10-02 · d5c28ef» или «2026-10-02 · d5c28ef · с правками».
 * Хеш всегда из семи знаков: длина сокращения у git зависит от настроек и размера репозитория.
 */
export function formatAppVersion({ date, hash, hasChanges }: CommitInfo): string {
  const version = `${date} · ${hash.slice(0, HASH_LENGTH)}`;
  return hasChanges ? `${version} · с правками` : version;
}
