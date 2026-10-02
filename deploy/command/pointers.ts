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

export function isCommitHash(value: string): boolean {
  return COMMIT_HASH.test(value);
}

export function assertCommitHash(value: string): void {
  if (!isCommitHash(value)) {
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
 * Возврат после неудачи выкладки: оба указателя ставятся ровно такими, какими были до неё, а не
 * меняются местами. Скрипт переключения мог упасть между `previous` и `current`, и тогда «обратная
 * перестановка» дала бы третье состояние. Строка журнала прежнего релиза пишется всегда: упавший
 * скрипт мог успеть записать строку нового релиза, а `current` не переключить, и последняя строка
 * журнала снова должна быть равна `current`. Повторная строка прежнего релиза порядок в журнале
 * не нарушает. `null` – первая выкладка: до неё релиза не было, возвращаться некуда.
 */
export function planReturn(
  stateBefore: PointerState,
): { target: PointerState; recordActivation: true } | null {
  return stateBefore.current === null ? null : { target: stateBefore, recordActivation: true };
}

/**
 * Откат: `current` и `previous` меняются местами, включается релиз, который был `previous`. Отказ,
 * если `previous` нет, если он совпадает с `current` (так бывает после обрыва между переключением
 * `previous` и `current`: обмен местами молча ничего бы не сделал) или его каталога нет на сервере.
 * Отдаёт план в том же виде, что `planDeploy`: проверка и возврат при неудаче общие с выкладкой.
 */
export function planRollback(input: { state: PointerState; previousOnServer: boolean }): {
  release: string;
  plan: DeployPlan;
} {
  const { state, previousOnServer } = input;
  if (state.previous === null) {
    throw new Error("Откатывать некуда: прежнего релиза (previous) нет.");
  }
  if (state.previous === state.current) {
    throw new Error(
      `Откат невозможен: previous совпадает с current (${state.current}). Так бывает после обрыва между переключением указателей: проверь их на сервере.`,
    );
  }
  if (!previousOnServer) {
    throw new Error(
      `Откатывать некуда: каталога прежнего релиза ${state.previous} нет на сервере.`,
    );
  }
  return {
    release: state.previous,
    plan: {
      deliver: false,
      switchPointers: true,
      recordActivation: true,
      next: { current: state.previous, previous: state.current },
    },
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
  if (hash === target || !isCommitHash(hash)) {
    throw new Error(`Ссылка ${name} ведёт не на релиз: ${target}`);
  }
  return hash;
}
