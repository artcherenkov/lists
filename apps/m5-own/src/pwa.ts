import { registerSW } from "virtual:pwa-register";

import { log, logError } from "./journal.ts";

const UPDATE_CHECK_MS = 60 * 60 * 1000;
const RELOAD_TIMEOUT_MS = 3000;

/**
 * Регистрирует service worker и показывает кнопку, когда скачана новая версия. Нажатие включает ждущий worker
 * и перезагружает страницу; если смена worker не пришла за таймаут, страница перезагружается сама.
 */
export function registerPwa(button: HTMLButtonElement): void {
  if (!("serviceWorker" in navigator)) return log("warn", "service worker не поддерживается");
  let registration: ServiceWorkerRegistration | undefined;

  const check = (reason: string) =>
    registration?.update().then(
      () => log("info", `проверка новой версии (${reason}): готово`),
      (error) =>
        log("info", `проверка новой версии (${reason}): не удалась, ${error?.name ?? error}`),
    );

  navigator.serviceWorker.addEventListener("controllerchange", () =>
    log("info", "service worker: сменился управляющий"),
  );

  // Без сети регистрация не удаётся (проверка sw.js падает), и workbox не сообщает о ждущей версии, хотя она уже скачана
  // раньше: кнопка нужна именно тогда, поэтому ждущий worker ищем по самой регистрации.
  void navigator.serviceWorker.getRegistration().then((reg) => {
    if (!reg) return;
    registration ??= reg;
    if (!reg.waiting) return;
    log("info", "service worker: скачанная ранее новая версия ждёт");
    button.hidden = false;
  });
  document.addEventListener(
    "visibilitychange",
    () => document.visibilityState === "visible" && check("возврат на экран"),
  );
  setInterval(() => check("раз в час"), UPDATE_CHECK_MS);
  registerSW({
    immediate: true,
    onNeedRefresh() {
      log("info", "service worker: новая версия скачана и ждёт");
      button.hidden = false;
    },
    onOfflineReady: () => log("info", "service worker: готов к работе без сети"),
    onRegisteredSW(_url, reg) {
      registration = reg;
      log("info", `service worker: зарегистрирован${reg?.active ? " (активен)" : ""}`);
      reg?.addEventListener("updatefound", () =>
        log("info", "service worker: найдена новая версия, скачивается"),
      );
    },
    onRegisterError: (error) => logError("service worker: регистрация", error),
  });

  button.addEventListener("click", () => {
    log("info", "нажато «обновить»");
    const waiting = registration?.waiting;
    if (!waiting) return location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), {
      once: true,
    });
    waiting.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => location.reload(), RELOAD_TIMEOUT_MS);
  });
}
