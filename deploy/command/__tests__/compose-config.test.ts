import { describe, expect, it } from "vitest";

import { caddyImageFromComposeConfig } from "../compose-config.ts";

describe("образ Caddy из compose.yaml релиза", () => {
  it("берёт образ сервиса caddy, а не соседнего", () => {
    const json = JSON.stringify({
      services: { server: { image: "lists-server:1" }, caddy: { image: "caddy:2.11.4-alpine" } },
    });
    expect(caddyImageFromComposeConfig(json)).toBe("caddy:2.11.4-alpine");
  });

  it("нет сервиса caddy – ошибка", () => {
    expect(() => caddyImageFromComposeConfig(JSON.stringify({ services: {} }))).toThrow(/caddy/);
  });

  it("имя образа с пробелом или `;` не уходит в команду shell", () => {
    const json = JSON.stringify({ services: { caddy: { image: "caddy; reboot" } } });
    expect(() => caddyImageFromComposeConfig(json)).toThrow(/Недопустимое имя образа/);
  });
});
