import { GlassButton } from "./glass-button.tsx";

/** Нажатие на любое место включает новую версию; закрыть кнопку нельзя. */
export function UpdateButton({ onUpdate }: { onUpdate: () => void }) {
  return (
    <GlassButton
      onClick={onUpdate}
      className="h-16 flex-1 flex-col items-start justify-center gap-0.5 px-5 text-left whitespace-normal text-primary-foreground"
    >
      <span className="text-sm font-medium">Вышла новая версия</span>
      <span className="text-xs text-balance text-primary-foreground/70">
        Нажмите, чтобы обновить приложение
      </span>
    </GlassButton>
  );
}
