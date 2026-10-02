import type { ComponentProps } from "react";

import { Button } from "@lists/ui/components/ui/button";

const GLASS =
  "rounded-full border border-white/25 bg-primary/65 shadow-lg backdrop-blur-xl hover:bg-primary/75";

/** Кнопка в стекле поверх списка: общий вид «Добавить» и кнопки обновления. */
export function GlassButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "className"> & { className?: string }) {
  return <Button className={className ? `${GLASS} ${className}` : GLASS} {...props} />;
}
