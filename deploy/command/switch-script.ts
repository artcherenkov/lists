import { REMOTE_ROOT } from "./config.ts";
import { assertCommitHash, type PointerState } from "./pointers.ts";

export const RELEASES_LOG = `${REMOTE_ROOT}/releases.log`;

/**
 * Скрипт переключения для сервера, `set -e`. Порядок шагов – часть гарантии:
 * 1. строка журнала `<время UTC> <хеш>`: ошибка записи случается до переключения и ничего не меняет;
 * 2. `previous`: обрыв между ссылками не теряет прежний релиз;
 * 3. `current`.
 * Каждая ссылка меняется атомарно (`ln` во временное имя и `mv -T`), `null` удаляет ссылку.
 */
export function buildSwitchScript(target: PointerState, recordActivation: boolean): string {
  const lines = ["set -e", `cd ${REMOTE_ROOT}`];
  if (recordActivation) {
    if (target.current === null)
      throw new Error("В журнал включений нечего записывать: current пуст");
    assertCommitHash(target.current);
    lines.push(
      `printf '%s %s\\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" ${target.current} >> ${RELEASES_LOG}`,
    );
  }
  lines.push(setPointer("previous", target.previous), setPointer("current", target.current));
  return lines.join("\n");
}

function setPointer(name: string, release: string | null): string {
  if (release === null) return `rm -f ${name}`;
  assertCommitHash(release);
  return `ln -sfn releases/${release} ${name}.new && mv -T ${name}.new ${name}`;
}
