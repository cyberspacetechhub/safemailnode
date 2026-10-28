import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const store: Map<string, RateLimitEntry> = global.rateLimitStore || new Map();
if (!global.rateLimitStore) {
  global.rateLimitStore = store;
}

export interface RateLimitOptions {
  /** Unique bucket namespace (e.g. "auth:login", "api:send-email") */
  namespace: string;
  /** Maximum requests allowed within the window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Optional custom identifier (such as API key or email); defaults to client IP */
  identifier?: string;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * Checks rate limit and returns a 429 NextResponse if exceeded, or null if allowed.
 */
export function enforceRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): NextResponse | null {
  const now = Date.now();

  // Periodic cleanup of expired keys to avoid memory growth
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) store.delete(k);
    }
  }

  const id = options.identifier || getClientIp(req);
  const key = `${options.namespace}:${id}`;
  const windowMs = options.windowSeconds * 1000;

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  existing.count += 1;
  if (existing.count > options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      {
        success: false,
        code: "RATE_LIMIT_EXCEEDED",
        message: `Too many requests. Please wait ${retryAfterSec} seconds before trying again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null;
}
