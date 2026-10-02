import type { Cancellation } from "./cancellation.ts";

import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";

import { caddyImageFromComposeConfig } from "./compose-config.ts";
import { REMOTE_ROOT, SSH_HOST } from "./config.ts";
import { run } from "./exec.ts";
import { assertCommitHash, parsePointerState, type PointerState } from "./pointers.ts";
import { createStepRunner, inspectStateCommand, type ExecuteOnServer } from "./steps.ts";
import { buildSwitchScript } from "./switch-script.ts";

/** Код выхода `flock`-обёртки, когда блокировка занята (`EX_TEMPFAIL`). */
const LOCK_BUSY_EXIT_CODE = 75;
const LOCK_FILE = `${REMOTE_ROOT}/deploy.lock`;
const LOCK_OWNER_FILE = `${REMOTE_ROOT}/deploy.lock.owner`;
const STAGING_DIR = `${REMOTE_ROOT}/tmp`;

/**
 * Опции на каждое соединение: без запроса пароля и с проверкой, что сервер жив. Обрыв сети
 * замечается примерно за минуту, а не зависает до таймаута TCP.
 */
const SSH_OPTIONS = [
  "-o",
  "BatchMode=yes",
  "-o",
  "ConnectTimeout=15",
  "-o",
  "ServerAliveInterval=15",
  "-o",
  "ServerAliveCountMax=4",
];

const COMPOSE_FILE = `${REMOTE_ROOT}/current/compose.yaml`;

export class LockBusyError extends Error {
  constructor(owner: string) {
    super(
      `Другая выкладка или откат уже идут${owner === "" ? "" : ` (${owner})`}. Дождись её конца и повтори.`,
    );
    this.name = "LockBusyError";
  }
}

/** Соединение держателя закрылось, пока операция шла: сервер мог отпустить блокировку. */
export class LockLostError extends Error {
  constructor() {
    super(
      "Блокировка на сервере потеряна: соединение, которое её держало, закрылось (сон ноутбука или обрыв сети). " +
        "Операция остановлена перед следующим шагом, но шаг на сервере мог ещё идти, а другая выкладка могла уже начаться. " +
        `Проверь указатели и журнал: ${inspectStateCommand()}`,
    );
    this.name = "LockLostError";
  }
}

export interface DeployLock {
  /** Срабатывает, если держатель закрылся не по `release`: дальше действовать под блокировкой нельзя. */
  lost: AbortSignal;
  release(): Promise<void>;
}

/** Запускает на сервере оболочку, которая держит блокировку; подменяется в тестах. */
export type SpawnLockHolder = (script: string) => ChildProcess;

const spawnSshLockHolder: SpawnLockHolder = (script) =>
  spawn("ssh", [...SSH_OPTIONS, SSH_HOST, script], {
    stdio: ["pipe", "pipe", "pipe"],
    detached: true,
  });

export function releaseDir(commit: string): string {
  assertCommitHash(commit);
  return `${REMOTE_ROOT}/releases/${commit}`;
}

/**
 * Берёт блокировку на сервере и держит её, пока жив этот процесс `ssh`.
 *
 * Операция идёт несколькими командами `ssh`, а `flock` держится, пока открыт файл. Поэтому
 * отдельное соединение запускает на сервере оболочку, которая берёт `flock`, печатает `LOCKED` и
 * ждёт конца своего стандартного ввода (`cat`). Ввод – канал из этого процесса: блокировка
 * освобождается, когда мы закрыли ввод (`release`), когда процесс упал или убит (канал закрыт,
 * `cat` видит конец ввода), когда оборвалось соединение (сервер закрывает ввод оболочки).
 * Процесс `ssh` вынесен в свою группу, чтобы Ctrl+C не убил его раньше, чем остановятся
 * команды операции; освобождает его `release` из `finally`.
 *
 * Если держатель закрылся сам (ноутбук спал, `ServerAlive` оборвал соединение), сервер мог
 * отпустить блокировку: срабатывает `lost`, и операция останавливается перед следующим шагом.
 * Если ноутбук пропал без закрытия соединения, сервер держит блокировку, пока не обнаружит
 * обрыв по TCP keepalive.
 */
export async function acquireLock(
  owner: string,
  stop: AbortSignal,
  spawnHolder: SpawnLockHolder = spawnSshLockHolder,
): Promise<DeployLock> {
  if (!/^[0-9A-Za-z:._ -]+$/.test(owner)) throw new Error(`Недопустимое имя владельца: ${owner}`);

  const script = [
    `mkdir -p ${REMOTE_ROOT}`,
    // Дописывание, а не `>`: открытие с усечением стёрло бы запись владельца у занятой блокировки.
    `exec 9>>${LOCK_FILE}`,
    `flock -n 9 || { echo BUSY; cat ${LOCK_OWNER_FILE} 2>/dev/null; exit ${LOCK_BUSY_EXIT_CODE}; }`,
    `echo '${owner}' > ${LOCK_OWNER_FILE}`,
    // Под блокировкой чистим остатки прерванных выкладок.
    `rm -rf ${STAGING_DIR}`,
    `mkdir -p ${STAGING_DIR} ${REMOTE_ROOT}/releases`,
    "echo LOCKED",
    "cat >/dev/null",
  ].join("\n");

  return new Promise<DeployLock>((resolve, reject) => {
    const child = spawnHolder(script);
    const lostController = new AbortController();
    let stdout = "";
    let stderr = "";
    let locked = false;
    let releasing = false;

    const exited = new Promise<void>((done) => child.once("close", () => done()));
    const lock: DeployLock = {
      lost: lostController.signal,
      async release() {
        releasing = true;
        child.stdin!.end();
        const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
        await exited;
        clearTimeout(timer);
      },
    };

    // Пока блокировки нет, остановка просто закрывает соединение; потом его закрывает `release`.
    const onStop = () => {
      if (!locked) child.kill("SIGTERM");
    };
    stop.addEventListener("abort", onStop, { once: true });

    child.stdin!.on("error", () => {});
    child.stderr!.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.stdout!.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (!locked && stdout.includes("LOCKED\n")) {
        locked = true;
        resolve(lock);
      }
    });
    child.once("error", reject);
    child.once("close", (code) => {
      stop.removeEventListener("abort", onStop);
      if (locked) {
        if (!releasing) lostController.abort(new LockLostError());
        return;
      }
      if (code === LOCK_BUSY_EXIT_CODE) {
        reject(new LockBusyError(stdout.replace(/^BUSY\n/, "").trim()));
      } else {
        reject(
          new Error(`Не удалось взять блокировку на сервере (ssh, код ${code})\n${stderr.trim()}`),
        );
      }
    });
  });
}

/**
 * Команды на сервере. Каждая – один короткий шаг по `ssh`; блокировку держит `acquireLock`.
 * Мягкая остановка не даёт начаться следующему шагу, жёсткая прерывает идущий.
 */
export function createRemote(cancel: Cancellation, execute: ExecuteOnServer = executeOverSsh) {
  const runStep = createStepRunner(cancel, execute);

  return {
    async readPointers(): Promise<PointerState> {
      return parsePointerState(
        await runStep(
          "чтение указателей",
          [
            `cd ${REMOTE_ROOT}`,
            `echo "current=$(readlink current || true)"`,
            `echo "previous=$(readlink previous || true)"`,
          ].join("\n"),
        ),
      );
    },

    async releaseExists(commit: string): Promise<boolean> {
      const answer = await runStep(
        "поиск релиза на сервере",
        `test -d ${releaseDir(commit)} && echo yes || echo no`,
      );
      return answer.trim() === "yes";
    },

    readChecksums(commit: string): Promise<string> {
      return runStep("чтение SHA256SUMS", `cat ${releaseDir(commit)}/SHA256SUMS`);
    },

    /**
     * Кладёт каталог релиза в `releases/<commit>`: распаковка во временный каталог, `sha256sum -c`,
     * переименование. Каталог релиза появляется на сервере только целым и проверенным.
     */
    async deliver(commit: string, localReleaseDir: string): Promise<void> {
      const staging = `${STAGING_DIR}/${randomBytes(6).toString("hex")}`;
      const archive = await packDirectory(localReleaseDir, cancel.stop);
      await runStep(
        "доставка архива",
        `mkdir -p ${staging} && tar -xzf - -C ${staging} --no-same-owner`,
        { input: archive },
      );
      await runStep(
        "сверка сумм и переименование релиза",
        [
          "set -e",
          `cd ${staging}`,
          "sha256sum -c --quiet --strict SHA256SUMS",
          "chmod -R u=rwX,go=rX .",
          `mv -T ${staging} ${releaseDir(commit)}`,
        ].join("\n"),
      );
    },

    /** `caddy validate` Caddyfile релиза в контейнере образа, закреплённого в `compose.yaml` релиза. */
    async validateCaddyfile(commit: string): Promise<void> {
      const dir = releaseDir(commit);
      const config = await runStep(
        "чтение compose.yaml релиза",
        `docker compose -f ${dir}/compose.yaml config --format json`,
      );
      const image = caddyImageFromComposeConfig(config);
      await runStep(
        "caddy validate",
        `docker run --rm -v ${dir}:/release:ro ${image} caddy validate --config /release/Caddyfile --adapter caddyfile`,
      );
    },

    /** Запись в журнал и переключение указателей одним скриптом: порядок – в `buildSwitchScript`. */
    async switchPointers(target: PointerState, recordActivation: boolean): Promise<void> {
      await runStep("переключение указателей", buildSwitchScript(target, recordActivation));
    },

    /** После переключения шаг доводится до конца: остановка между ним и `reload` оставила бы релиз наполовину. */
    async composeUp(): Promise<void> {
      await runStep(
        "docker compose up",
        `docker compose -f ${COMPOSE_FILE} up -d --wait --wait-timeout 120`,
        { interruptible: false },
      );
    },

    async caddyReload(): Promise<void> {
      await runStep(
        "caddy reload",
        `docker compose -f ${COMPOSE_FILE} exec -T caddy caddy reload --config /srv/current/Caddyfile --adapter caddyfile`,
        { interruptible: false },
      );
    },
  };
}

export type Remote = ReturnType<typeof createRemote>;

/** Свою группу процессов: Ctrl+C в терминале не прерывает команду на сервере раньше времени. */
const executeOverSsh: ExecuteOnServer = async (script, input, kill) => {
  const { stdout } = await run("ssh", [...SSH_OPTIONS, SSH_HOST, script], {
    signal: kill,
    input,
    detached: true,
  });
  return stdout;
};

/** Каталог одним архивом `tar.gz`, без метаданных macOS. */
function packDirectory(dir: string, signal: AbortSignal): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const tar = spawn("tar", ["--no-xattrs", "-czf", "-", "-C", dir, "."], {
      env: { ...process.env, COPYFILE_DISABLE: "1" },
      signal,
    });
    let stderr = "";
    tar.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    tar.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    tar.once("error", reject);
    tar.once("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`tar завершилась с кодом ${code}\n${stderr}`)),
    );
  });
}
