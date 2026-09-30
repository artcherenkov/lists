import type { ReactNode } from "react";

import { Button } from "@lists/ui/components/ui/button";
import { useState } from "react";

/** После закрытия шторки показывает кнопку, которая открывает её заново. */
export function Reopenable({ children }: { children: (onClosed: () => void) => ReactNode }) {
  const [shown, setShown] = useState(true);

  if (shown) return children(() => setShown(false));

  return (
    <div className="p-4">
      <Button variant="outline" onClick={() => setShown(true)}>
        Открыть шторку
      </Button>
    </div>
  );
}
