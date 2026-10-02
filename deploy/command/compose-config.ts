/** Образ сервиса `caddy` из вывода `docker compose config --format json`. */
export function caddyImageFromComposeConfig(json: string): string {
  const config = JSON.parse(json) as { services?: { caddy?: { image?: unknown } } };
  const image = config.services?.caddy?.image;
  if (typeof image !== "string")
    throw new Error("В compose.yaml релиза нет сервиса caddy с образом");
  // Имя образа попадает в команду shell на сервере.
  if (!/^[\w./:@-]+$/.test(image)) throw new Error(`Недопустимое имя образа Caddy: ${image}`);
  return image;
}
