import { createRemoteJWKSet, jwtVerify } from "jose";
import type { IncomingMessage } from "node:http";

export const ISSUER = process.env.ISSUER ?? "http://127.0.0.1:13200";
// В продукте токен выдаёт плагин jwt better-auth (EdDSA, /jwks); здесь – выдуманный ключ из server/dev.ts.
const jwks = createRemoteJWKSet(new URL(`${ISSUER}/jwks`), { cooldownDuration: 0 });

export type Session = { user: string; exp: number };

export async function sessionOf(req: IncomingMessage): Promise<Session | null> {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(h.slice(7), jwks, { issuer: ISSUER, audience: ISSUER, algorithms: ["EdDSA"] });
    return payload.sub && payload.exp ? { user: payload.sub, exp: payload.exp } : null;
  } catch {
    return null;
  }
}
