import type { SheetProps } from "@lists/sheet";

import { Sheet } from "@lists/sheet";

const CLOSE_THRESHOLD = 0.4;

/** `Sheet` с настройками, общими для всех шторок Watchlist. */
export function AppSheet(
  props: Omit<SheetProps, "hideTitle" | "closeFraction" | "scaleBackground">,
) {
  return <Sheet hideTitle closeFraction={CLOSE_THRESHOLD} scaleBackground {...props} />;
}
