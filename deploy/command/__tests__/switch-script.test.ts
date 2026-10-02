import { describe, expect, it } from "vitest";

import { buildSwitchScript } from "../switch-script.ts";

const A = "a".repeat(40);
const B = "b".repeat(40);

/** Номера строк скрипта, в которых встречается фрагмент. */
function linesWith(script: string, fragment: string): number[] {
  return script.split("\n").flatMap((line, index) => (line.includes(fragment) ? [index] : []));
}

describe("скрипт переключения на сервере", () => {
  it("сначала журнал, затем previous, затем current", () => {
    const script = buildSwitchScript({ current: B, previous: A }, true);

    const [log] = linesWith(script, "releases.log");
    const [previous] = linesWith(script, "mv -T previous.new previous");
    const [current] = linesWith(script, "mv -T current.new current");
    expect(log).toBeLessThan(previous!);
    expect(previous).toBeLessThan(current!);
  });

  it("строка журнала называет включаемый релиз и дописывается в конец журнала", () => {
    const script = buildSwitchScript({ current: B, previous: A }, true);

    expect(script).toContain(`${B} >> /opt/lists/releases.log`);
    expect(script).not.toContain(`${A} >>`);
  });

  it("без записи журнала скрипт его не трогает", () => {
    expect(buildSwitchScript({ current: B, previous: A }, false)).not.toContain("releases.log");
  });

  it("остановка при первой ошибке: ошибка журнала не доходит до указателей", () => {
    expect(buildSwitchScript({ current: B, previous: A }, true).split("\n")[0]).toBe("set -e");
  });

  it("ссылки ведут на каталоги релизов относительным путём", () => {
    const script = buildSwitchScript({ current: B, previous: A }, true);

    expect(script).toContain(`ln -sfn releases/${A} previous.new`);
    expect(script).toContain(`ln -sfn releases/${B} current.new`);
  });

  it("пустой previous удаляет ссылку", () => {
    const script = buildSwitchScript({ current: A, previous: null }, true);

    expect(script).toContain("rm -f previous");
    expect(script).not.toContain("previous.new");
  });

  it("записывать в журнал при пустом current нельзя", () => {
    expect(() => buildSwitchScript({ current: null, previous: A }, true)).toThrow(/current пуст/);
  });

  it("хеш не из 40 знаков не попадает в команду", () => {
    expect(() => buildSwitchScript({ current: "x; reboot", previous: null }, true)).toThrow(
      /хеш коммита/,
    );
  });
});
