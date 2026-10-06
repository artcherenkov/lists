import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope;

// Как у Watchlist: без clientsClaim, новая версия ждёт кнопки. /api/ идёт мимо worker, а /ps/ –
// отдельное приложение со своим worker (scope /ps/): навигацию туда этот worker не берёт.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//, /^\/ps(\/|$)/],
  }),
);

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") void self.skipWaiting();
});
