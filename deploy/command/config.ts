/** SSH-псевдоним сервера `cora` в `~/.ssh/config`. */
export const SSH_HOST = "lists";

/** Каталог релизов, указателей, журнала и блокировки на сервере; контейнер Caddy видит его как `/srv`. */
export const REMOTE_ROOT = "/opt/lists";

export const SITE_URL = "https://v2.watchlist.acherenkov.com";

/** Сколько ждать ответа на один запрос проверки. */
export const REQUEST_TIMEOUT_MS = 15_000;
