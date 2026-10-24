/**
 * Следит за именем бота входа (решение 2 вехи 6): запрашивает его у сервера, пока не получит, раз
 * в `retryMs`. Запрос всегда один: следующий уходит только после ответа на прежний. `onName` – имя
 * пришло, запросов больше нет; `onUnavailable` – запрос не удался. Возвращает остановку: после неё
 * нет ни запросов, ни вызовов.
 */
export function watchBotUsername({
  load,
  retryMs,
  onName,
  onUnavailable,
}: {
  load: () => Promise<string | null>;
  retryMs: number;
  onName: (username: string) => void;
  onUnavailable: () => void;
}): () => void {
  let stopped = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const attempt = async () => {
    const username = await load();
    if (stopped) return;
    if (username === null) {
      onUnavailable();
      retry = setTimeout(attempt, retryMs);
      return;
    }
    onName(username);
  };
  void attempt();
  return () => {
    stopped = true;
    clearTimeout(retry);
  };
}
