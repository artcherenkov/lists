import { useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RELOAD_TIMEOUT_MS = 3000;

function checkForUpdate(registration: ServiceWorkerRegistration) {
  // Если сервер недоступен, update() отклоняется (TypeError). Это не ошибка приложения:
  // следующая проверка повторит попытку.
  registration.update().catch(() => {});
}

/** Проверяет новую версию при возвращении на экран и раз в час, пока приложение открыто. */
function watchForUpdates(registration: ServiceWorkerRegistration) {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdate(registration);
  });
  setInterval(() => checkForUpdate(registration), UPDATE_CHECK_INTERVAL_MS);
}

/**
 * Включает новую версию и перезагружает страницу. Ждущий worker включается по сообщению, и
 * перезагрузку запускает смена управляющего worker. Если смена не пришла за таймаут, страница
 * всё равно перезагружается: кнопка, которую нельзя закрыть, не должна зависать.
 */
function reloadOnNewVersion(registration: ServiceWorkerRegistration | undefined) {
  const waiting = registration?.waiting;
  // Ждущего нет в сеансе первого открытия: новый worker включается сам, а перезагрузка
  // дожидается его включения.
  if (!waiting) {
    location.reload();
    return;
  }
  navigator.serviceWorker.addEventListener("controllerchange", () => location.reload(), {
    once: true,
  });
  waiting.postMessage({ type: "SKIP_WAITING" });
  setTimeout(() => location.reload(), RELOAD_TIMEOUT_MS);
}

/**
 * Регистрирует service worker и следит за новой версией. `isNewVersionReady` – версия скачана и
 * ждёт; `updateToNewVersion` включает её и перезагружает страницу.
 */
export function useServiceWorker() {
  const registrationRef = useRef<ServiceWorkerRegistration>(undefined);
  const {
    needRefresh: [isNewVersionReady],
  } = useRegisterSW({
    // Подписки живут, пока открыта страница: хук стоит в корне приложения и не размонтируется.
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      watchForUpdates(registration);
    },
  });

  return {
    isNewVersionReady,
    updateToNewVersion: () => reloadOnNewVersion(registrationRef.current),
  };
}
