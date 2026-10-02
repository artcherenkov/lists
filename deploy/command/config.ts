/** SSH-псевдоним сервера `cora` в `~/.ssh/config`. */
export const SSH_HOST = "lists";

/** Каталог релизов, указателей, журнала и блокировки на сервере; контейнер Caddy видит его как `/srv`. */
export const REMOTE_ROOT = "/opt/lists";

export const SITE_URL = "https://v2.watchlist.acherenkov.com";

/** Сколько ждать ответа на один запрос проверки. */
export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Сколько повторять запросы проверки, если сайт не отвечает. Релиз при этом включён: срок должен
 * пережить кратковременный обрыв сети ноутбука (смена Wi-Fi, пробуждение), но не заставлять ждать
 * долго, если сети нет совсем. Минута – три-четыре прохода при таймауте запроса 15 с.
 */
export const VERIFY_DEADLINE_MS = 60_000;
/** Первая выкладка: Caddy выпускает сертификат, ответа по HTTPS может не быть несколько минут. */
export const FIRST_DEPLOY_VERIFY_DEADLINE_MS = 300_000;
/** Пауза между проходами. */
export const VERIFY_RETRY_DELAY_MS = 5_000;
