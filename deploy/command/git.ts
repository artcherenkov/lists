import { run } from "./exec.ts";
import { assertCommitHash } from "./pointers.ts";

const RELEASE_FILES = ["deploy/Caddyfile", "deploy/compose.yaml"];

/** Полный хеш коммита по ссылке (`HEAD`, ветка, сокращённый хеш). */
export async function resolveCommit(repoRoot: string, revision: string): Promise<string> {
  try {
    const { stdout } = await run(
      "git",
      ["rev-parse", "--verify", "--end-of-options", `${revision}^{commit}`],
      { cwd: repoRoot },
    );
    const hash = stdout.trim();
    assertCommitHash(hash);
    return hash;
  } catch (error) {
    throw new Error(`Не нашёл коммит «${revision}»`, { cause: error });
  }
}

/** Отказ до любых действий на сервере: релиз без настройки сервера выложить нельзя. */
export async function assertReleaseFilesInCommit(repoRoot: string, commit: string): Promise<void> {
  for (const file of RELEASE_FILES) {
    try {
      await run("git", ["cat-file", "-e", `${commit}:${file}`], { cwd: repoRoot });
    } catch {
      throw new Error(`В коммите ${commit.slice(0, 7)} нет ${file}: релиз выложить нельзя`);
    }
  }
}

export async function workingTreeStatus(repoRoot: string): Promise<string> {
  const { stdout } = await run(
    "git",
    ["--no-optional-locks", "status", "--porcelain", "--untracked-files=all"],
    { cwd: repoRoot },
  );
  return stdout;
}
