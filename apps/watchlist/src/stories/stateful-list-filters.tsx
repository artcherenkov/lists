import { ListFilters, type ListFiltersValue } from "@lists/ui/components/list-filters";
import { useState } from "react";

import {
  countChangedFilters,
  DEFAULT_FILTERS,
  KIND_FILTER_OPTIONS,
  RATING_BOUNDS,
} from "../sample/views.ts";

export function StatefulListFilters({
  initialValue = DEFAULT_FILTERS,
  resultCount,
}: {
  initialValue?: ListFiltersValue;
  /** `undefined` – ещё считается. */
  resultCount?: number;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <ListFilters
      value={value}
      onChange={setValue}
      kindFilterOptions={KIND_FILTER_OPTIONS}
      ratingBounds={RATING_BOUNDS}
      activeCount={countChangedFilters(value)}
      resultCount={resultCount}
      onReset={() => setValue(DEFAULT_FILTERS)}
    />
  );
}
