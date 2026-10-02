/** Полный хеш коммита: имя каталога релиза на сервере и аргумент команд, которые строят shell. */
const COMMIT_HASH = /^[0-9a-f]{40}$/;

/** Что показывают символьные ссылки `current` и `previous` в `/opt/lists`; `null` – ссылки нет. */
export interface PointerState {
  current: string | null;
  previous: string | null;
}

export interface DeployPlan {
  /** Релиза нет на сервере: нужны сборка и доставка. */
  deliver: boolean;
  /** Указатели меняются: нужны `caddy validate`, переключение, `compose up` и `reload`. */
  switchPointers: boolean;
  /**
   * Дописать релиз в журнал включений. Строка пишется вместе с переключением и перед ним, поэтому
   * журнал содержит всё, на что когда-либо указывал `current`, а его последняя строка равна
   * `current`. Когда указатели не меняются, строки нет: релиз уже записан.
   */
  recordActivation: boolean;
  /** Указатели после выкладки. */
  next: PointerState;
}

export function assertCommitHash(value: string): void {
  if (!COMMIT_HASH.test(value)) {
    throw new Error(`Ожидался полный хеш коммита из 40 знаков, получено: ${value}`);
  }
}

/** Выкладка нового или лежащего на сервере релиза: прежний текущий становится `previous`. */
export function pointersAfterDeploy(state: PointerState, release: string): PointerState {
  if (state.current === release) return state;
  return { current: release, previous: state.current };
}

export function planDeploy(input: {
  state: PointerState;
  release: string;
  releaseOnServer: boolean;
}): DeployPlan {
  const { state, release, releaseOnServer } = input;
  return {
    deliver: !releaseOnServer,
    switchPointers: state.current !== release,
    recordActivation: state.current !== release,
    next: pointersAfterDeploy(state, release),
  };
}

/**
 * Разбирает вывод `readlink` для двух ссылок: строки `current=releases/<хеш>` и
 * `previous=releases/<хеш>`, у отсутствующей ссылки значение пустое. Неожиданную цель не угадываем:
 * продолжение с неверным состоянием перезаписало бы указатели.
 */
export function parsePointerState(output: string): PointerState {
  const values = new Map<string, string>();
  for (const line of output.split("\n")) {
    const separator = line.indexOf("=");
    if (separator > 0) values.set(line.slice(0, separator), line.slice(separator + 1).trim());
  }
  return {
    current: releaseFromTarget("current", values),
    previous: releaseFromTarget("previous", values),
  };
}

function releaseFromTarget(name: string, values: Map<string, string>): string | null {
  const target = values.get(name);
  if (target === undefined) throw new Error(`В выводе состояния нет ссылки ${name}`);
  if (target === "") return null;
  const hash = target.replace(/^releases\//, "");
  if (hash === target || !COMMIT_HASH.test(hash)) {
    throw new Error(`Ссылка ${name} ведёт не на релиз: ${target}`);
  }
  return hash;
}
