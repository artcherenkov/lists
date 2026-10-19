import { admin } from "./helpers.ts";

/** Сервер на текущей версии данных (3) и без внедрённых сбоев. */
export async function atCurrent() {
  await admin("/dev/settings", { min_dv: 3, cur_dv: 3 });
  await admin("/dev/fail", { clear: true, loseResponses: 0 });
}
