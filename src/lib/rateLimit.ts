import { NextRequest, NextResponse } from "next/server";

export interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowSeconds: number;
  identifier?: string;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

function rateLimitResponse(retryAfterSec: number, limit: number): NextResponse {
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
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// ── Upstash path (production) ────────────────────────────────────────────────
async function enforceUpstash(
  key: string,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(options.limit, `${options.windowSeconds} s`),
    prefix: "rl",
  });

  const { success, reset } = await ratelimit.limit(key);
  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return rateLimitResponse(retryAfterSec, options.limit);
  }
  return null;
}

// ── In-memory fallback (dev / no Upstash configured) ────────────────────────
interface RateLimitEntry { count: number; resetAt: number; }
declare global { var rateLimitStore: Map<string, RateLimitEntry> | undefined; }
const store: Map<string, RateLimitEntry> = global.rateLimitStore || new Map();
if (!global.rateLimitStore) global.rateLimitStore = store;

function enforceInMemory(key: string, options: RateLimitOptions): NextResponse | null {
  const now = Date.now();
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) store.delete(k);
    }
  }
  const windowMs = options.windowSeconds * 1000;
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }
  existing.count += 1;
  if (existing.count > options.limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return rateLimitResponse(retryAfterSec, options.limit);
  }
  return null;
}

// ── Public API ───────────────────────────────────────────────────────────────
export async function enforceRateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const id = options.identifier || getClientIp(req);
  const key = `${options.namespace}:${id}`;

  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return enforceUpstash(key, options);
  }

  return enforceInMemory(key, options);
}
