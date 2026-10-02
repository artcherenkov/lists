import { Button } from "@lists/ui/components/ui/button";

/** Нажатие на любое место включает новую версию; закрыть кнопку нельзя. */
export function UpdateButton({ onUpdate }: { onUpdate: () => void }) {
  return (
    <Button
      onClick={onUpdate}
      className="fixed right-[calc(1.5rem+4rem+0.75rem)] bottom-[calc(1.5rem+env(safe-area-inset-bottom))] left-4 z-40 h-16 flex-col items-start justify-center gap-0.5 rounded-full border border-white/25 bg-primary/65 px-5 text-left whitespace-normal text-primary-foreground shadow-lg backdrop-blur-xl hover:bg-primary/75"
    >
      <span className="text-sm font-medium">Вышла новая версия</span>
      <span className="text-xs text-balance text-primary-foreground/70">
        Нажмите, чтобы обновить приложение
      </span>
    </Button>
  );
}
