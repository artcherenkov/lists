import type { IncomingMessage } from "node:http";

import { createRemoteJWKSet, jwtVerify } from "jose";

export const AUDIENCE = "lists";
const JWKS_URL =
  process.env.JWKS_URL ?? `http://127.0.0.1:${process.env.PORT ?? 13400}/api/auth/jwks`;
const jwks = createRemoteJWKSet(new URL(JWKS_URL));

/** Аккаунт из токена EdDSA, подписанного входом (better-auth, плагин `jwt`): ключи – по JWKS. */
export async function ownerOf(req: IncomingMessage): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, {
      audience: AUDIENCE,
      algorithms: ["EdDSA"],
    });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
