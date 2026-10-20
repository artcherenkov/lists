import { InputOTP, InputOTPGroup, InputOTPSlot } from "@lists/ui/components/ui/input-otp";
import { cn } from "@lists/ui/lib/utils";

import { CODE_LENGTH } from "./login-view.ts";

const SLOT_INDEXES = Array.from({ length: CODE_LENGTH }, (_, index) => index);
const ONLY_DIGITS = "^\\d+$";

/** Из вставки берём только цифры: из Telegram код может приехать с пробелом или словом «Код:». */
function digitsOnly(pasted: string) {
  return pasted.replace(/\D/g, "").slice(0, CODE_LENGTH);
}

/**
 * Поле кода с системной клавиатурой: шесть клеток на всю ширину. Шестая цифра сразу отправляет
 * код – кнопка «Войти» остаётся для тех, кто вставил код и ждёт, что нажмёт сам.
 */
export function LoginCodeField({
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  size,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete: (code: string) => void;
  invalid: boolean;
  disabled: boolean;
  size: "md" | "lg";
}) {
  return (
    <InputOTP
      aria-label="Код из Telegram"
      maxLength={CODE_LENGTH}
      pattern={ONLY_DIGITS}
      inputMode="numeric"
      autoComplete="one-time-code"
      pasteTransformer={digitsOnly}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      containerClassName="w-full"
    >
      <InputOTPGroup className="w-full gap-2 has-aria-invalid:ring-0">
        {SLOT_INDEXES.map((index) => (
          <InputOTPSlot
            key={index}
            index={index}
            aria-invalid={invalid || undefined}
            className={cn(
              "min-w-0 flex-1 rounded-xl border font-medium tabular-nums first:rounded-xl last:rounded-xl",
              size === "lg" ? "h-14 text-2xl" : "h-12 text-xl",
              invalid && "text-destructive",
            )}
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
