// Параметры запуска берутся из адреса: так тесты открывают «устройство» нужной версии данных и аккаунта.
const query = new URLSearchParams(location.search);

export const USER = query.get("user") ?? "alice";
/** Версия данных этой сборки. */
export const DATA_VERSION = Number(query.get("dv") ?? 1);
/** Имя устройства: по нему тестовый прокси отключает сеть одному устройству. */
export const DEVICE = query.get("dev") ?? "x";
export const RETRY_MS = Number(query.get("retry") ?? 3000);
export const MAX_ATTEMPTS = Number(query.get("attempts") ?? 5);
export const FAULTY_STEP = query.get("faultyStep") === "1";
export const API = `/api/d/${DEVICE}`;
