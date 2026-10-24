import { useEffect, useState } from "react";

import { type LoginBot, LoginScreen } from "./screens/login-screen.tsx";
import { CODE_LENGTH, type CodeEntry, pastedCode, typedCode } from "./session/code-input.ts";
import { signIn, type SignInResult, watchLoginBot } from "./session/session.ts";

function problemText(result: Exclude<SignInResult, { kind: "signed-in" }>) {
  switch (result.kind) {
    case "wrong-code":
      return "Код неверный или устарел. Наберите его снова или получите новый у бота.";
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

/** Бот входа: имя называет сервер, ссылка – `start=login` (решение 2 вехи 6). */
function useLoginBot(): LoginBot {
  const [bot, setBot] = useState<LoginBot>("loading");
  useEffect(
    () =>
      watchLoginBot({
        onName: (username) =>
          setBot({ name: `@${username}`, link: `https://t.me/${username}?start=login` }),
        onUnavailable: () => setBot("unavailable"),
      }),
    [],
  );
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
    // Неверный код поле стирает: новый набирают сразу, не стирая прежний по цифре.

    setProblem(problemText(result));
  };

  const enter = (entry: CodeEntry | undefined) => {
    if (entry === undefined) return false;
    setCode(entry.code);
    setProblem(undefined);
    if (entry.submit) void submit(entry.code);
    return true;
  };

  return (
    <LoginScreen
      bot={bot}
      code={code}
      codeLength={CODE_LENGTH}
      checking={checking}
      problem={problem}
      onCodeChange={(value) => void enter(typedCode(value, code))}
      onCodePaste={(text) => enter(pastedCode(text))}
      onSubmit={() => void submit(code)}
      onUpdate={onUpdate}
    />
  );
}
