import { describe, expect, test } from "vitest";

import { checkNewMigrationName } from "../migration-files.ts";

// Идёт по настоящему каталогу миграций: в нём всегда есть применённый 0001_auth.sql. Образец имени
// и повтор номера проверяет `migrate.db.test.ts`.
describe("имя новой миграции", () => {
  test("номер больше всех в каталоге – можно", async () => {
    await expect(checkNewMigrationName("9999_next.sql")).resolves.toBeUndefined();
  });

  test("номер меньше последнего – отказ: файл встал бы перед применённым", async () => {
    await expect(checkNewMigrationName("0000_early.sql")).rejects.toThrow(
      "Номер новой миграции 0000_early.sql должен быть больше",
    );
  });
});
