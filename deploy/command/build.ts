import { copyFile, cp, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { computeChecksums, formatChecksums } from "./checksums.ts";
import { run } from "./exec.ts";
import { detail } from "./log.ts";

/**
 * Собирает релиз коммита во временном `git worktree` вне репозитория и передаёт каталог релиза
 * (`site/`, `Caddyfile`, `compose.yaml`, `SHA256SUMS`) в `use`. Worktree удаляется всегда.
 * Собирается именно коммит: рабочее дерево автора, в том числе неотслеживаемые файлы, в сборку не
 * попадает.
 */
export async function withBuiltRelease<T>(
  input: { repoRoot: string; commit: string; signal: AbortSignal },
  use: (releaseDir: string) => Promise<T>,
): Promise<T> {
  const { repoRoot, commit, signal } = input;
  const workDir = await mkdtemp(join(tmpdir(), "lists-deploy-"));
  const worktree = join(workDir, "worktree");
  const releaseDir = join(workDir, "release");

  try {
    detail("Создаю временный worktree коммита…");
    await run("git", ["worktree", "add", "--detach", worktree, commit], { cwd: repoRoot, signal });

    detail("Ставлю зависимости…");
    await run("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"], {
      cwd: worktree,
      env: buildEnv(),
      signal,
    });

    detail("Собираю apps/watchlist…");
    await run("pnpm", ["--filter", "watchlist", "build"], {
      cwd: worktree,
      env: buildEnv(),
      signal,
    });

    detail("Собираю релиз…");
    const siteDir = join(releaseDir, "site");
    await mkdir(releaseDir);
    await cp(join(worktree, "apps/watchlist/dist"), siteDir, { recursive: true });
    await copyFile(join(worktree, "deploy/Caddyfile"), join(releaseDir, "Caddyfile"));
    await copyFile(join(worktree, "deploy/compose.yaml"), join(releaseDir, "compose.yaml"));
    await stat(join(siteDir, "index.html"));
    await writeFile(
      join(releaseDir, "SHA256SUMS"),
      formatChecksums(await computeChecksums(siteDir)),
    );

    return await use(releaseDir);
  } finally {
    await removeWorktree(repoRoot, worktree, workDir);
  }
}

/** Номер версии должен называть коммит: `APP_VERSION` из окружения автора его бы подменил. */
function buildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.APP_VERSION;
  return env;
}

/** Уборка не прерывается сигналом и не скрывает ошибку, из-за которой началась. */
async function removeWorktree(repoRoot: string, worktree: string, workDir: string): Promise<void> {
  try {
    await run("git", ["worktree", "remove", "--force", worktree], { cwd: repoRoot });
  } catch {
    // Worktree мог не создаться; каталог удалим ниже, а запись в git уберёт prune.
  }
  await rm(workDir, { recursive: true, force: true });
  try {
    await run("git", ["worktree", "prune"], { cwd: repoRoot });
  } catch (error) {
    console.error("Не удалось выполнить git worktree prune:", error);
  }
}
