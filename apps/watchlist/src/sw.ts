import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// clientsClaim нет: страница первого открытия работает и без worker, а без сети приложение
// открывается уже со следующего запуска.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Любой адрес приложения открывает index.html из предкеша. /api/ идёт мимо worker.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/api\//] }),
);

// Новая версия ждёт, пока приложение не пришлёт это сообщение или пока не закроются все окна.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
