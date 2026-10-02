import type { PointerState } from "./pointers.ts";
import type { Remote } from "./remote.ts";

import { detail, warn } from "./log.ts";
import { isCommitHash } from "./pointers.ts";

/** Сколько последних разных релизов хранится на сервере. */
const KEPT_RELEASES = 5;

const LOG_LINE = /^\S+ (\S+)$/;

/**
 * Что удалить из `releases/`. Порядок релиза – его последняя строка в журнале включений: релиз,
 * включённый откатом, при этом свежий, а несколько строк одного релиза, в том числе подряд от
 * возврата, считаются один раз. Хранятся `KEPT_RELEASES` последних разных релизов из тех, чьи
 * каталоги есть; `current` и `previous` не удаляются никогда, даже вне пятёрки. Каталог, которого
 * нет в журнале, не включался (не прошёл `caddy validate`) и удаляется. Имя не из 40 шестнадцатеричных
 * знаков чужое: его не трогают, а возвращают в `foreign`, чтобы о нём предупредить. Если последняя
 * строка журнала не равна `current`, журнал повреждён или обрезан: порядку верить нельзя, ошибка.
 */
export function selectReleasesToRemove(input: {
  log: string;
  directories: string[];
  state: PointerState;
}): { remove: string[]; foreign: string[] } {
  const logLines = input.log.split("\n").filter((line) => line !== "");
  assertLogEndsWithCurrent(logLines, input.state.current);

  const releases = input.directories.filter(isCommitHash);
  const foreign = input.directories.filter((name) => !isCommitHash(name));

  const onDisk = new Set(releases);
  const lastLine = new Map<string, number>();
  logLines.forEach((line, index) => {
    const hash = releaseOfLogLine(line);
    if (hash !== undefined && onDisk.has(hash)) lastLine.set(hash, index);
  });
  const newestFirst = [...lastLine].sort((a, b) => b[1] - a[1]).map(([hash]) => hash);

  const kept = new Set(newestFirst.slice(0, KEPT_RELEASES));
  for (const pointer of [input.state.current, input.state.previous]) {
    if (pointer !== null) kept.add(pointer);
  }
  return { remove: releases.filter((hash) => !kept.has(hash)), foreign };
}

function releaseOfLogLine(line: string): string | undefined {
  return LOG_LINE.exec(line)?.[1];
}

/** Строку журнала пишет скрипт переключения перед переключением, поэтому последняя равна `current`. */
function assertLogEndsWithCurrent(logLines: string[], current: string | null): void {
  const last = logLines.at(-1);
  const lastRelease = last === undefined ? undefined : releaseOfLogLine(last);
  if (lastRelease !== current) {
    throw new Error(
      `Журнал включений не сходится с указателем: последняя строка ${JSON.stringify(last ?? "")}, current ${current ?? "нет"}. Очистка ничего не удалила.`,
    );
  }
}

/** Очистка под той же блокировкой, что и выкладка: указатели читаются после неё заново. */
export async function cleanOldReleases(
  remote: Pick<Remote, "readPointers" | "readReleaseLog" | "listReleases" | "removeReleases">,
): Promise<void> {
  const state = await remote.readPointers();
  const { remove, foreign } = selectReleasesToRemove({
    log: await remote.readReleaseLog(),
    directories: await remote.listReleases(),
    state,
  });
  for (const name of foreign) warn(`В releases/ чужой каталог ${name}: очистка его не трогает`);
  await remote.removeReleases(remove);
  detail(`Удалено старых релизов: ${remove.length}`);
}
