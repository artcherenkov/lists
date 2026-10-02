import { execFileSync } from "node:child_process";

const HASH_LENGTH = 7;

interface AppVersionSource {
  /** Каталог внутри git-репозитория, из которого берётся коммит. */
  repoDir: string;
  /** Переменные окружения: `APP_VERSION` и всё, что нужно git. */
  env: NodeJS.ProcessEnv;
}

/**
 * Номер версии для показа, например «2026-10-02 · d5c28ef» или «2026-10-02 · d5c28ef · с правками».
 * `APP_VERSION` – для сборок без `.git` и для второй сборки тестов обновления. Иначе – из git:
 * дата и хеш коммита `HEAD`, пометка «с правками», если изменены отслеживаемые файлы.
 * Подставное значение при отсутствии git дало бы разным сборкам один номер, поэтому сборка падает.
 */
export function resolveAppVersion({ repoDir, env }: AppVersionSource): string {
  if (env.APP_VERSION) return env.APP_VERSION;

  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: repoDir, env, encoding: "utf8", stdio: "pipe" }).trim();

  try {
    const [date, hash] = git("log", "-1", "--format=%cs %H", "HEAD").split(" ");
    // Неотслеживаемые файлы не в счёт: черновики лежат у разработчика всегда. Код без ссылки из
    // отслеживаемого файла сборка не читает, а правка ссылки даст пометку. Исключения – новый файл
    // в `public`, он копируется в сборку целиком, и классы Tailwind из нового файла в `src`:
    // Tailwind сканирует все файлы, и CSS изменится. Оба случая идут без пометки.
    // `--no-optional-locks`: без него статус обновляет индекс под `index.lock` и может сорвать
    // коммит, который идёт рядом.
    const hasChanges =
      git("--no-optional-locks", "status", "--porcelain", "--untracked-files=no") !== "";

    // Хеш обрезаем сами: длина сокращения у git зависит от настроек и размера репозитория.
    const version = `${date} · ${hash!.slice(0, HASH_LENGTH)}`;
    return hasChanges ? `${version} · с правками` : version;
  } catch (error) {
    throw new Error(
      "Не удалось определить номер версии: задайте переменную окружения APP_VERSION или собирайте внутри git-репозитория",
      { cause: error },
    );
  }
}
