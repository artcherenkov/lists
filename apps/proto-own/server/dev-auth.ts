// Подставной вход вместо better-auth: выдуманные аккаунты, ключ в памяти процесса.
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { AUDIENCE } from "./auth.ts";

const { publicKey, privateKey } = await generateKeyPair("EdDSA");
const publicJwk = { ...(await exportJWK(publicKey)), kid: "dev-1", alg: "EdDSA", use: "sig" };

export const jwks = () => ({ keys: [publicJwk] });

export function issueToken(user: string, ttlSeconds = 3600): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA", kid: "dev-1" })
    .setSubject(user)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(privateKey);
}
