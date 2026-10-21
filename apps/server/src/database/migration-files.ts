import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Файлы миграций релиза – где лежат и как называются: `0001_<что>.sql`, по порядку номеров.
 * Что миграции можно делать и как они применяются к базе – в `migrate.ts`.
 */
export interface Migration {
  name: string;
  sql: string;
}

// Номер в имени задаёт порядок: файл без номера встал бы после всех и заблокировал следующий.
const MIGRATION_NAME = /^\d{4}_[a-z0-9_]+\.sql$/;

const MIGRATIONS_DIR = path.join(import.meta.dirname, "../migrations");

/** Миграции этого релиза по порядку. */
export async function readMigrations(): Promise<Migration[]> {
  const names = await migrationNames();
  return Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(path.join(MIGRATIONS_DIR, name), "utf8"),
    })),
  );
}

/**
 * Отказывает в имени нового файла, если оно не по образцу или номер не больше всех в каталоге:
 * файл перед уже применённым сервер на выкладке не примет.
 */
export async function checkNewMigrationName(name: string) {
  const names = await migrationNames();
  checkMigrationNames([...names, name]);
  const last = names.at(-1);
  if (last !== undefined && name < last) {
    throw new Error(`Номер новой миграции ${name} должен быть больше, чем у ${last}`);
  }
}

/** Кладёт новый файл в каталог миграций и возвращает его путь. */
export async function writeMigration(name: string, sql: string) {
  await checkNewMigrationName(name);
  const file = path.join(MIGRATIONS_DIR, name);
  await writeFile(file, sql, { flag: "wx" });
  return file;
}

/** Отказывает, если имя не по образцу или две миграции взяли один номер. */
export function checkMigrationNames(names: string[]) {
  const misnamed = names.filter((name) => !MIGRATION_NAME.test(name));
  if (misnamed.length > 0) {
    throw new Error(
      `Имя миграции не по образцу 0002_telegram_login.sql – номер, затем строчная латиница, цифры и _: ${misnamed.join(", ")}`,
    );
  }
  // Две ветки взяли один номер. Если первым выложен файл, который по имени идёт позже, следующий
  // релиз разойдётся с базой; отказ ловит это ещё на тестах после слияния.
  const numbers = names.map((name) => name.slice(0, 4));
  const repeated = numbers.filter((number, index) => numbers.indexOf(number) !== index);
  if (repeated.length > 0) {
    throw new Error(`Номер миграции повторяется: ${[...new Set(repeated)].join(", ")}`);
  }
}

async function migrationNames() {
  const names = await readdir(MIGRATIONS_DIR);
  return names.filter((name) => name.endsWith(".sql")).sort();
}
