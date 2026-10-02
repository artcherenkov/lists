import { describe, expect, it, vi } from "vitest";

import { cleanOldReleases, selectReleasesToRemove } from "../cleanup.ts";

/** Хеш по номеру: `h(1)` – `0000…1`. */
const h = (n: number) => n.toString(16).padStart(40, "0");
const line = (n: number, time = "2026-10-03T00:00:00Z") => `${time} ${h(n)}`;
const log = (...numbers: number[]) => numbers.map((n) => line(n)).join("\n") + "\n";
const dirs = (...numbers: number[]) => numbers.map(h);

describe("выбор релизов для очистки", () => {
  it("хранятся 5 последних релизов, остальные удаляются", () => {
    const result = selectReleasesToRemove({
      log: log(1, 2, 3, 4, 5, 6, 7),
      directories: dirs(1, 2, 3, 4, 5, 6, 7),
      state: { current: h(7), previous: h(6) },
    });

    expect(result.remove.sort()).toEqual(dirs(1, 2));
  });

  it("нечего удалять, если релизов не больше пяти", () => {
    expect(
      selectReleasesToRemove({
        log: log(1, 2, 3, 4, 5),
        directories: dirs(1, 2, 3, 4, 5),
        state: { current: h(5), previous: h(4) },
      }).remove,
    ).toEqual([]);
  });

  it("порядок – по последней строке: релиз, включённый откатом, свежий и остаётся", () => {
    // 1 включён откатом после 6, значит свежее 2–5.
    const result = selectReleasesToRemove({
      log: log(1, 2, 3, 4, 5, 6, 1),
      directories: dirs(1, 2, 3, 4, 5, 6),
      state: { current: h(1), previous: h(6) },
    });

    expect(result.remove).toEqual(dirs(2));
  });

  it("повторы и две строки подряд считаются один раз: неудачные выкладки не вытесняют рабочие релизы", () => {
    const result = selectReleasesToRemove({
      log: log(1, 2, 3, 4, 5, 6, 6, 6, 5, 5),
      directories: dirs(1, 2, 3, 4, 5, 6),
      state: { current: h(5), previous: h(6) },
    });

    expect(result.remove).toEqual(dirs(1));
  });

  it("previous не удаляется, даже если он вне пятёрки", () => {
    const result = selectReleasesToRemove({
      log: log(1, 2, 3, 4, 5, 6, 7, 8),
      directories: dirs(1, 2, 3, 4, 5, 6, 7, 8),
      state: { current: h(8), previous: h(1) },
    });

    expect(result.remove).toEqual(dirs(2, 3));
  });

  it("каталог, которого нет в журнале, удаляется", () => {
    const result = selectReleasesToRemove({
      log: log(1, 2),
      directories: dirs(1, 2, 9),
      state: { current: h(2), previous: h(1) },
    });

    expect(result.remove).toEqual(dirs(9));
  });

  it("релиз из журнала без каталога не занимает место в пятёрке", () => {
    const result = selectReleasesToRemove({
      log: log(1, 2, 3, 4, 5, 6, 7),
      directories: dirs(3, 4, 5, 6, 7),
      state: { current: h(7), previous: h(6) },
    });

    expect(result.remove).toEqual([]);
  });

  it("чужое имя каталога не трогают и возвращают для предупреждения", () => {
    const result = selectReleasesToRemove({
      log: log(1),
      directories: [h(1), "backup", "A".repeat(40), "abc"],
      state: { current: h(1), previous: null },
    });

    expect(result.remove).toEqual([]);
    expect(result.foreign).toEqual(["backup", "A".repeat(40), "abc"]);
  });

  it("имя, в котором хеш лишь часть, – чужое: не удаляется, даже когда его нет в журнале", () => {
    // Копия или архив релиза рядом с каталогами: rm -rf по такому имени удалил бы чужое.
    const foreignNames = [`${h(1)}.bak`, `${h(1)}-old`, `x${h(1)}`, `0${h(1)}`, h(1).slice(1)];

    const result = selectReleasesToRemove({
      log: log(1),
      directories: [h(1), ...foreignNames],
      state: { current: h(1), previous: null },
    });

    expect(result.remove).toEqual([]);
    expect(result.foreign).toEqual(foreignNames);
  });

  it("строки журнала не в формате пропускаются: хеш без времени релиз в порядок не ставит", () => {
    const result = selectReleasesToRemove({
      log: `мусор\n${h(1)}\n${log(2, 3, 4, 5, 6)}\n`,
      directories: dirs(1, 2, 3, 4, 5, 6),
      state: { current: h(6), previous: h(5) },
    });

    expect(result.remove).toEqual(dirs(1));
  });

  it("последняя строка журнала не равна current – ошибка, удалять нечего", () => {
    const state = { current: h(3), previous: h(2) };
    const directories = dirs(1, 2, 3, 4);

    expect(() => selectReleasesToRemove({ log: log(1, 2, 3, 4), directories, state })).toThrow(
      /Журнал включений не сходится/,
    );
  });

  it("журнал пуст, обрезан до мусора или current нет – ошибка", () => {
    const directories = dirs(1, 2);
    const state = { current: h(1), previous: null };

    for (const brokenLog of [
      "",
      "\n",
      `${log(1)}мусор\n`,
      `${log(1)}${h(1)}\n`,
      `${log(1)}${line(1)} лишнее\n`,
    ]) {
      expect(() => selectReleasesToRemove({ log: brokenLog, directories, state })).toThrow(
        /Журнал включений не сходится/,
      );
    }
    expect(() =>
      selectReleasesToRemove({
        log: log(1),
        directories,
        state: { current: null, previous: null },
      }),
    ).toThrow(/Журнал включений не сходится/);
  });
});

describe("очистка на сервере", () => {
  function fakeRemote(overrides: { directories?: string[] } = {}) {
    return {
      readPointers: vi.fn<() => Promise<{ current: string | null; previous: string | null }>>(
        async () => ({ current: h(7), previous: h(6) }),
      ),
      readReleaseLog: vi.fn<() => Promise<string>>(async () => log(1, 2, 3, 4, 5, 6, 7)),
      listReleases: vi.fn<() => Promise<string[]>>(
        async () => overrides.directories ?? dirs(1, 2, 3, 4, 5, 6, 7),
      ),
      removeReleases: vi.fn<(commits: string[]) => Promise<void>>(async () => {}),
    };
  }

  it("указатели читаются заново, удаляются выбранные релизы", async () => {
    const remote = fakeRemote();

    await cleanOldReleases(remote);

    expect(remote.readPointers).toHaveBeenCalled();
    expect(remote.removeReleases).toHaveBeenCalledWith(dirs(1, 2));
  });

  it("журнал не сходится с current: ошибка, ничего не удалено", async () => {
    const remote = fakeRemote();
    remote.readReleaseLog.mockResolvedValueOnce(log(1, 2, 3, 4, 5, 6));

    await expect(cleanOldReleases(remote)).rejects.toThrow(/Журнал включений не сходится/);

    expect(remote.removeReleases).not.toHaveBeenCalled();
  });

  it("журнал не прочитан: ошибка шага, ничего не удалено", async () => {
    const remote = fakeRemote();
    remote.readReleaseLog.mockRejectedValueOnce(new Error("cat: нет файла"));

    await expect(cleanOldReleases(remote)).rejects.toThrow("cat: нет файла");

    expect(remote.removeReleases).not.toHaveBeenCalled();
  });

  it("чужой каталог не уходит на удаление, а о нём предупреждение", async () => {
    const remote = fakeRemote({ directories: [...dirs(1, 2, 3, 4, 5, 6, 7), "backup"] });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await cleanOldReleases(remote);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("backup"));
    warn.mockRestore();

    expect(remote.removeReleases).toHaveBeenCalledWith(dirs(1, 2));
  });
});
