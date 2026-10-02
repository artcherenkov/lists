import { AppSheet } from "./app-sheet.tsx";
import { useClosingSheet } from "./use-closing-sheet.ts";

/**
 * Профиль. Пока в нём только номер версии: выход и остальное появятся со входом.
 * Монтируется на время показа.
 */
export function ProfileSheet({
  version,
  onClosed,
}: {
  /** Готовая строка, например «2026-10-02 · d5c28ef». */
  version: string;
  /** Шторка доехала вниз: родитель её размонтирует. */
  onClosed: () => void;
}) {
  const { open, close } = useClosingSheet();

  return (
    <AppSheet open={open} onClose={close} onClosed={onClosed} title="Профиль">
      <div className="grid gap-4 pt-2 pb-4">
        <h2 className="font-heading text-xl font-medium">Профиль</h2>
        <dl className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Версия</dt>
          <dd className="text-base">{version}</dd>
        </dl>
      </div>
    </AppSheet>
  );
}
