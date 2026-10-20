import { Button } from "@lists/ui/components/ui/button";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

import {
  SAMPLE_LOGIN_STARTS,
  type SampleLoginStart,
  useSampleLogin,
} from "./sample/use-sample-login.ts";
import { LoginKeypad } from "./screens/login-keypad.tsx";
import { LoginOneScreen } from "./screens/login-one-screen.tsx";
import { LoginTwoSteps } from "./screens/login-two-steps.tsx";

/**
 * Прототип вехи 6: три варианта экрана входа на подставном входе. Вариант – `?variant=a|b|c`,
 * с какого состояния начать – `?state=`, `?pill=0` прячет плашку переключателя для снимков.
 */

const VARIANTS = {
  a: { label: "A", Screen: LoginOneScreen },
  b: { label: "B", Screen: LoginTwoSteps },
  c: { label: "C", Screen: LoginKeypad },
} as const;

type VariantKey = keyof typeof VARIANTS;

function isVariant(value: string | null): value is VariantKey {
  return value !== null && value in VARIANTS;
}

function isStart(value: string | null): value is SampleLoginStart {
  return SAMPLE_LOGIN_STARTS.some((start) => start.value === value);
}

function readAddress() {
  const params = new URLSearchParams(location.search);
  const variant = params.get("variant");
  const start = params.get("state");
  return {
    variant: isVariant(variant) ? variant : "a",
    start: isStart(start) ? start : "start",
    pillShown: params.get("pill") !== "0",
  };
}

export function LoginVariants({ onSignedIn }: { onSignedIn: () => void }) {
  const [address, setAddress] = useState(readAddress);

  const change = (patch: { variant?: VariantKey; start?: SampleLoginStart }) => {
    const next = { ...address, ...patch };
    const params = new URLSearchParams(location.search);
    params.set("variant", next.variant);
    params.set("state", next.start);
    history.replaceState(null, "", `?${params}`);
    setAddress(next);
  };

  return (
    <>
      {/* key: новый вариант или состояние начинают подставной вход заново. */}
      <SampleLoginScreen
        key={`${address.variant}-${address.start}`}
        variant={address.variant}
        start={address.start}
        onSignedIn={onSignedIn}
      />
      {address.pillShown &&
        createPortal(
          <VariantPill
            variant={address.variant}
            start={address.start}
            onChange={change}
            onHide={() => setAddress({ ...address, pillShown: false })}
          />,
          document.body,
        )}
    </>
  );
}

function SampleLoginScreen({
  variant,
  start,
  onSignedIn,
}: {
  variant: VariantKey;
  start: SampleLoginStart;
  onSignedIn: () => void;
}) {
  const login = useSampleLogin({ start, onSignedIn, onBotMessage: (text) => toast(text) });
  const { Screen } = VARIANTS[variant];
  return <Screen {...login} />;
}

function VariantPill({
  variant,
  start,
  onChange,
  onHide,
}: {
  variant: VariantKey;
  start: SampleLoginStart;
  onChange: (patch: { variant?: VariantKey; start?: SampleLoginStart }) => void;
  onHide: () => void;
}) {
  return (
    <div className="fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/85 p-1 shadow-lg backdrop-blur-xl">
      {(Object.keys(VARIANTS) as VariantKey[]).map((key) => (
        <Button
          key={key}
          size="sm"
          variant={key === variant ? "default" : "ghost"}
          className="w-8 rounded-full"
          aria-pressed={key === variant}
          onClick={() => onChange({ variant: key })}
        >
          {VARIANTS[key].label}
        </Button>
      ))}
      <select
        aria-label="Состояние"
        value={start}
        onChange={(event) => {
          const value = event.target.value;
          if (isStart(value)) onChange({ start: value });
        }}
        className="h-8 rounded-full bg-muted px-2 text-sm"
      >
        {SAMPLE_LOGIN_STARTS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        size="icon-sm"
        variant="ghost"
        className="rounded-full"
        aria-label="Спрятать переключатель"
        onClick={onHide}
      >
        <XIcon />
      </Button>
    </div>
  );
}
