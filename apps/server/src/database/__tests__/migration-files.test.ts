import { describe, expect, test } from "vitest";

import { checkNewMigrationName, readMigrations } from "../migration-files.ts";

// Идёт по настоящему каталогу миграций: в нём всегда есть применённый 0001_auth.sql.
describe("имя новой миграции", () => {
  test("номер больше всех в каталоге – можно", async () => {
    await expect(checkNewMigrationName("9999_next.sql")).resolves.toBeUndefined();
  });

  test("номер меньше последнего – отказ: файл встал бы перед применённым", async () => {
    await expect(checkNewMigrationName("0000_early.sql")).rejects.toThrow(
      "Номер новой миграции 0000_early.sql должен быть больше",
    );
  });

  test("номер последнего файла – отказ, хотя имя идёт после него", async () => {
    const lastNumber = (await readMigrations()).at(-1)?.name.slice(0, 4);

    await expect(checkNewMigrationName(`${lastNumber}_zzz.sql`)).rejects.toThrow(
      `Номер миграции повторяется: ${lastNumber}`,
    );
  });
});
