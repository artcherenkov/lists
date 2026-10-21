import { useEffect, useState } from "react";

import { type LoginBot, LoginScreen } from "./screens/login-screen.tsx";
import { CODE_LENGTH, codeFromField, codeInText } from "./session/code-input.ts";
import { loadBotUsername, signIn, type SignInResult } from "./session/session.ts";
// Пока сервер не назвал бота, имя запрашивается снова: сервер мог перезапускаться, а событие
// `online` приходит, только когда пропадала сама сеть устройства.
const BOT_RETRY_MS = 5000;

function problemText(result: Exclude<SignInResult, { kind: "signed-in" }>) {
  switch (result.kind) {
    case "wrong-code":
      return "Код неверный или устарел. Проверьте цифры или получите новый код у бота.";
    case "too-often":
      return result.retryAfterSeconds === null
        ? "Слишком много попыток. Попробуйте позже."
        : `Слишком много попыток. Попробуйте через ${Math.ceil(result.retryAfterSeconds / 60)} мин.`;
    case "no-connection":
      return "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.";
    case "server-error":
      return "Сервер не смог проверить код. Попробуйте ещё раз.";
  }
}

/**
 * Бот входа: имя называет сервер, ссылка – `start=login` (решение 2 вехи 6). Пока имени нет, оно
 * запрашивается раз в несколько секунд и сразу, когда вернулась сеть.
 */
function useLoginBot(): LoginBot {
  const [bot, setBot] = useState<LoginBot>("loading");

  useEffect(() => {
    let stopped = false;
    let loaded = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      if (loaded) return;
      const username = await loadBotUsername();
      if (stopped || loaded) return;
      if (username) {
        loaded = true;
        setBot({ name: `@${username}`, link: `https://t.me/${username}?start=login` });
        return;
      }
      setBot("unavailable");
      // Повтор по таймеру – один, даже если запросы по событию `online` шли параллельно.
      clearTimeout(retry);
      retry = setTimeout(load, BOT_RETRY_MS);
    };
    void load();
    window.addEventListener("online", load);
    return () => {
      stopped = true;
      clearTimeout(retry);
      window.removeEventListener("online", load);
    };
  }, []);

  return bot;
}

/** Экран входа, подключённый ко входу на устройстве: удачный вход сменит экран на список. */
export function ConnectedLoginScreen({ onUpdate }: { onUpdate: (() => void) | undefined }) {
  const bot = useLoginBot();
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [problem, setProblem] = useState<string>();

  const submit = async (digits: string) => {
    setChecking(true);
    setProblem(undefined);
    const result = await signIn(digits);
    if (result.kind === "signed-in") return;
    setChecking(false);
    setProblem(problemText(result));
  };

  return (
    <LoginScreen
      bot={bot}
      code={code}
      codeLength={CODE_LENGTH}
      checking={checking}
      problem={problem}
      onCodeChange={(value) => {
        const digits = codeFromField(value);
        if (digits === undefined || digits === code) return;
        setCode(digits);
        setProblem(undefined);
        if (digits.length === CODE_LENGTH) void submit(digits);
      }}
      onCodePaste={(text) => {
        const pasted = codeInText(text);
        if (pasted === undefined) return false;
        // Вставка заменяет поле целиком и всегда отправляет код: и тот же, что был, – например,
        // когда вернулась связь.
        setCode(pasted);
        void submit(pasted);
        return true;
      }}
      onSubmit={() => void submit(code)}
      onUpdate={onUpdate}
    />
  );
}
