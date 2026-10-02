import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveAppVersion } from "../app-version.ts";

const COMMIT_DATE = "2026-03-04";

let sandbox: string;
let repoDir: string;
let env: NodeJS.ProcessEnv;

/** Окружение без `GIT_*` прогона (хук, worktree) и без настроек git автора. */
function isolatedEnv(): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH,
    // Сообщения git по-английски: тест сверяет причину отказа.
    LC_ALL: "C",
    HOME: sandbox,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    // Без потолка git в каталоге без репозитория поднялся бы выше и нашёл чужой.
    GIT_CEILING_DIRECTORIES: sandbox,
  };
}

function git(...args: string[]): string {
  return execFileSync(
    "git",
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    {
      cwd: repoDir,
      env: {
        ...env,
        GIT_AUTHOR_DATE: `${COMMIT_DATE}T12:00:00+0000`,
        GIT_COMMITTER_DATE: `${COMMIT_DATE}T12:00:00+0000`,
      },
      encoding: "utf8",
      stdio: "pipe",
    },
  ).trim();
}

function commitFile(name: string, content: string) {
  writeFileSync(join(repoDir, name), content);
  git("add", name);
  git("commit", "-m", `добавил ${name}`);
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "app-version-"));
  repoDir = join(sandbox, "repo");
  mkdirSync(repoDir);
  env = isolatedEnv();
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe("resolveAppVersion", () => {
  describe("в git-репозитории", () => {
    beforeEach(() => {
      git("init");
      commitFile("tracked.txt", "первая версия\n");
    });

    it("чистое дерево: дата коммита и семь знаков хеша без пометки", () => {
      const fullHash = git("rev-parse", "HEAD");

      const version = resolveAppVersion({ repoDir, env });

      expect(fullHash).toHaveLength(40);
      expect(version).toBe(`${COMMIT_DATE} · ${fullHash.slice(0, 7)}`);
    });

    it("изменённый отслеживаемый файл помечает сборку «с правками»", () => {
      const fullHash = git("rev-parse", "HEAD");
      writeFileSync(join(repoDir, "tracked.txt"), "правка\n");

      const version = resolveAppVersion({ repoDir, env });

      expect(version).toBe(`${COMMIT_DATE} · ${fullHash.slice(0, 7)} · с правками`);
    });

    it("неотслеживаемый файл пометки не даёт", () => {
      const fullHash = git("rev-parse", "HEAD");
      writeFileSync(join(repoDir, "draft.txt"), "черновик\n");

      const version = resolveAppVersion({ repoDir, env });

      expect(version).toBe(`${COMMIT_DATE} · ${fullHash.slice(0, 7)}`);
    });

    it("не обновляет индекс git: без блокировки коммит рядом не сорвётся", () => {
      // Новая метка времени файла – повод для `git status` обновить индекс, если ему это разрешено.
      const later = new Date(Date.now() + 60_000);
      utimesSync(join(repoDir, "tracked.txt"), later, later);
      const indexBefore = readFileSync(join(repoDir, ".git", "index"));

      resolveAppVersion({ repoDir, env });

      expect(readFileSync(join(repoDir, ".git", "index")).equals(indexBefore)).toBe(true);
    });

    it("берёт APP_VERSION, даже когда в git есть коммит", () => {
      const version = resolveAppVersion({
        repoDir,
        env: { ...env, APP_VERSION: "2000-01-01 · 2222222" },
      });

      expect(version).toBe("2000-01-01 · 2222222");
    });
  });

  it("без APP_VERSION и без git-репозитория падает с подсказкой", () => {
    const resolve = () => resolveAppVersion({ repoDir, env });

    expect(resolve).toThrow(
      /Не удалось определить номер версии: задайте переменную окружения APP_VERSION/,
    );
    // Причина – отсутствие репозитория, а не недоступный git.
    expect(resolve).toThrow(
      expect.objectContaining({
        cause: expect.objectContaining({ stderr: expect.stringContaining("not a git repository") }),
      }),
    );
  });
});
