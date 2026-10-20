/**
 * Общие свойства трёх вариантов экрана входа (прототип вехи 6). Варианты различаются устройством,
 * а показывают одно и то же: строки готовые, правил входа экран не знает.
 */

/** Почему войти не вышло – готовый текст и что его исправит. */
export interface LoginProblem {
  text: string;
  /**
   * `retype` – код неверный, можно ввести другой; `new-link` – попытка истекла или закрыта,
   * нужен новый код от бота; `retry` – повторить проверку того же кода; `wait` – подождать.
   */
  fix: "retype" | "new-link" | "retry" | "wait";
}

export interface LoginScreenProps {
  /** Имя бота для подписи, например «@watchlist_v2_bot». */
  botName: string;
  /**
   * Ссылка на бота в этой попытке уже открывалась: человек вернулся из Telegram, возможно
   * после перезагрузки приложения, и код, скорее всего, у него.
   */
  codeSent: boolean;
  code: string;
  /** Код отправлен на проверку, ответа ещё нет. */
  checking: boolean;
  problem?: LoginProblem;
  /** Синхронный: переход в Telegram – в стеке этого же нажатия, иначе iOS его не откроет. */
  onOpenBot: () => void;
  onCodeChange: (code: string) => void;
  onSubmit: (code: string) => void;
  onRetry: () => void;
}

export const CODE_LENGTH = 6;
