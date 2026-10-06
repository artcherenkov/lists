// Сборка макета: версия данных и метка идут из release.json, адрес API и аккаунт – фиксированные.
// Тестовая сборка (`TEST_PARAMS=1`) берёт параметры из адреса: так тесты открывают «устройство» нужной версии данных и аккаунта.
const query = __TEST_PARAMS__ ? new URLSearchParams(location.search) : new URLSearchParams();

export const USER = query.get("user") ?? "lab";
/** Версия данных этой сборки. */
export const DATA_VERSION = Number(query.get("dv") ?? __DATA_VERSION__);
/** Метка макета для показа: A или B. */
export const LABEL = __LABEL__;
export const BUILD = __BUILD__;
export const TEST_PARAMS = __TEST_PARAMS__;
/** Имя устройства: по нему тестовый прокси отключает сеть одному устройству. */
export const DEVICE = query.get("dev") ?? "x";
export const RETRY_MS = Number(query.get("retry") ?? 3000);
export const MAX_ATTEMPTS = Number(query.get("attempts") ?? 5);
export const FAULTY_STEP = query.get("faultyStep") === "1";
export const API = __TEST_PARAMS__ ? `/api/d/${DEVICE}` : "/api";
