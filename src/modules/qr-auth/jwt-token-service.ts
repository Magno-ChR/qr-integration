import { SignJWT, jwtVerify } from "jose";

import { getEnv } from "@/shared/config/env";

function secretKey() {
  return new TextEncoder().encode(getEnv().JWT_SECRET);
}

export async function issueAccessToken() {
  const env = getEnv();
  const issuedAt = Math.floor(Date.now() / 1000);

  return new SignJWT({
    unique_name: env.JWT_UNIQUE_NAME,
    role: env.JWT_ROLE,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setNotBefore(issuedAt)
    .setExpirationTime(issuedAt + env.JWT_EXPIRES_SECONDS)
    .sign(secretKey());
}

export async function verifyAccessToken(token: string) {
  const env = getEnv();

  await jwtVerify(token, secretKey(), {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
    algorithms: ["HS256"],
  });
}
