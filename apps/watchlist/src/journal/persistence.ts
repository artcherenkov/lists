import type { Log } from "./store.ts";

import { yesNo } from "./format.ts";

const failed = (error: unknown) => `ошибка (${String(error)})`;
const answer = (value: boolean | string) => (typeof value === "boolean" ? yesNo(value) : value);

/**
 * Просит платформу не вытеснять данные приложения, только если оно открыто с экрана «Домой»:
 * во вкладке браузера запрос не нужен. В журнал – ответы до и после.
 */
export async function recordPersistence(args: {
  storage: Pick<StorageManager, "persist" | "persisted"> | undefined;
  homeScreen: boolean;
  log: Log;
}) {
  const { storage, homeScreen, log } = args;
  if (!storage?.persist || !storage.persisted) {
    log("persist(): navigator.storage.persist недоступен");
    return;
  }
  const before = await storage.persisted().catch(failed);
  if (!homeScreen) {
    log(
      `persist() не вызван: приложение открыто во вкладке, а не с экрана «Домой»; persisted() = ${answer(before)}`,
    );
    return;
  }
  const granted = await storage.persist().catch(failed);
  const after = await storage.persisted().catch(failed);
  log(
    `persisted() до: ${answer(before)}; persist() ответил: ${answer(granted)}; persisted() после: ${answer(after)}`,
  );
}
