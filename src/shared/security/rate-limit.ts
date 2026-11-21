import { sql, lt } from "drizzle-orm";

import { getDb } from "@/shared/db/client";
import { rateLimitBuckets } from "@/shared/db/schema";

export const rateLimitPolicies = {
  "dashboard-login": { limit: 10, windowMs: 30 * 60 * 1000 },
  "qr-login": { limit: 20, windowMs: 60 * 1000 },
  "qr-payments": { limit: 20, windowMs: 60 * 1000 },
  "bg-qr-generate": { limit: 20, windowMs: 60 * 1000 },
  "bg-qr-status": { limit: 30, windowMs: 60 * 1000 },
} as const;

export type RateLimitScope = keyof typeof rateLimitPolicies;

const retentionMs = 30 * 60 * 1000;

export async function consumeRateLimit(
  scope: RateLimitScope,
  clientKey: string,
) {
  const policy = rateLimitPolicies[scope];
  const start = new Date(
    Math.floor(Date.now() / policy.windowMs) * policy.windowMs,
  );
  const database = getDb();
  const [bucket] = await database
    .insert(rateLimitBuckets)
    .values({
      scope,
      clientKey,
      windowStart: start,
      requestCount: 1,
    })
    .onConflictDoUpdate({
      target: [
        rateLimitBuckets.scope,
        rateLimitBuckets.clientKey,
        rateLimitBuckets.windowStart,
      ],
      set: {
        requestCount: sql`${rateLimitBuckets.requestCount} + 1`,
      },
    })
    .returning({ requestCount: rateLimitBuckets.requestCount });

  const requestCount = bucket?.requestCount ?? policy.limit + 1;

  if (requestCount === 1) {
    await database
      .delete(rateLimitBuckets)
      .where(
        lt(rateLimitBuckets.windowStart, new Date(Date.now() - retentionMs)),
      );
  }

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((start.getTime() + policy.windowMs - Date.now()) / 1000),
  );

  return {
    allowed: requestCount <= policy.limit,
    retryAfterSeconds,
  };
}

export function clientAddress(headers: {
  get(name: string): string | null;
}) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const candidate = forwarded || realIp || "local";

  return candidate.replace(/[^\w.:-]/g, "").slice(0, 64) || "local";
}
