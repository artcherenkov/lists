import type { LoginProblem, LoginScreenProps } from "../screens/login-view.ts";

import { useState } from "react";

/** Подставной вход для прототипа экрана: сервера ещё нет, бот и проверка кода – в памяти. */

export const SAMPLE_BOT_NAME = "@watchlist_v2_bot";
export const SAMPLE_RIGHT_CODE = "135790";
const MAX_WRONG_CODES = 5;

/** С какого состояния открыть экран: `?state=` в адресе прототипа. */
export const SAMPLE_LOGIN_STARTS = [
  { value: "start", label: "Исходное" },
  { value: "sent", label: "После возврата" },
  { value: "wrong-code", label: "Неверный код" },
  { value: "expired", label: "Попытка истекла" },
  { value: "locked", label: "5 неверных" },
  { value: "offline", label: "Нет сети" },
  { value: "too-often", label: "Слишком часто" },
] as const;

export type SampleLoginStart = (typeof SAMPLE_LOGIN_STARTS)[number]["value"];

interface SampleLoginState {
  codeSent: boolean;
  code: string;
  wrongCodes: number;
  checking: boolean;
  problem?: LoginProblem;
}

const EXPIRED: LoginProblem = {
  text: "Код больше не действует: с отправки прошло 10 минут. Получите новый.",
  fix: "new-link",
};
const LOCKED: LoginProblem = {
  text: "Код закрыт после 5 неверных попыток. Получите новый.",
  fix: "new-link",
};

/** `left` – от 1 до 4: после пятого неверного кода попытка закрыта. */
function attemptsLeftText(left: number) {
  return left === 1
    ? "Неверный код. Осталась 1 попытка."
    : `Неверный код. Осталось ${left} попытки.`;
}

function wrongCode(wrongCodes: number): LoginProblem {
  return wrongCodes >= MAX_WRONG_CODES
    ? LOCKED
    : { text: attemptsLeftText(MAX_WRONG_CODES - wrongCodes), fix: "retype" };
}

function initialState(start: SampleLoginStart): SampleLoginState {
  const sent = { codeSent: true, code: "", wrongCodes: 0, checking: false };
  switch (start) {
    case "start":
      return { ...sent, codeSent: false };
    case "sent":
      return sent;
    case "wrong-code":
      return { ...sent, code: "135709", wrongCodes: 1, problem: wrongCode(1) };
    case "expired":
      return { ...sent, problem: EXPIRED };
    case "locked":
      return { ...sent, code: "135097", wrongCodes: MAX_WRONG_CODES, problem: LOCKED };
    case "offline":
      return {
        ...sent,
        code: SAMPLE_RIGHT_CODE,
        problem: { text: "Нет сети – код не проверен. Подключитесь и повторите.", fix: "retry" },
      };
    case "too-often":
      return {
        ...sent,
        problem: { text: "Слишком много попыток входа. Попробуйте через 5 минут.", fix: "wait" },
      };
  }
}

/**
 * Состояние экрана входа и его обработчики. Верный код – `SAMPLE_RIGHT_CODE`, его «присылает
 * бот» в `onBotMessage`; остальные коды неверные, пятый закрывает попытку.
 */
export function useSampleLogin({
  start,
  onSignedIn,
  onBotMessage,
}: {
  start: SampleLoginStart;
  onSignedIn: () => void;
  onBotMessage: (text: string) => void;
}): LoginScreenProps {
  const [state, setState] = useState(() => initialState(start));

  const check = (code: string) => {
    setState((current) => ({ ...current, code, checking: true, problem: undefined }));
    setTimeout(() => {
      if (code === SAMPLE_RIGHT_CODE) {
        onSignedIn();
        return;
      }
      setState((current) => {
        const wrongCodes = current.wrongCodes + 1;
        return { ...current, checking: false, wrongCodes, problem: wrongCode(wrongCodes) };
      });
    }, 700);
  };

  return {
    botName: SAMPLE_BOT_NAME,
    ...state,
    onOpenBot: () => {
      setState({ codeSent: true, code: "", wrongCodes: 0, checking: false });
      onBotMessage(`${SAMPLE_BOT_NAME}: код для входа – ${SAMPLE_RIGHT_CODE}`);
    },
    onCodeChange: (code) => {
      setState((current) => ({
        ...current,
        code,
        // Новый ввод снимает «неверный код»; истёкшую попытку снимает только новый код от бота.
        problem: current.problem?.fix === "retype" ? undefined : current.problem,
      }));
    },
    onSubmit: (code) => {
      if (state.problem?.fix === "new-link" || state.problem?.fix === "wait") return;
      check(code);
    },
    onRetry: () => check(state.code),
  };
}
