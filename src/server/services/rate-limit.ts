import { createHash } from "node:crypto";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const buckets = new Map<string, { count: number; resetAt: number }>();
const sharedLimiters = new Map<string, Ratelimit>();

let sharedRedis: Redis | null = null;

const SHARED_RATE_LIMIT_ENV = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: Date;
};

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number;

  constructor(result: RateLimitResult) {
    super(`Too many requests. Try again in ${result.retryAfterSeconds}s.`);
    this.name = "RateLimitExceededError";
    this.retryAfterSeconds = result.retryAfterSeconds;
  }
}

export async function consumeRateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  const sharedLimiter = getSharedLimiter(input);

  if (sharedLimiter) {
    try {
      const result = await sharedLimiter.limit(input.key);
      const resetAt =
        typeof result.reset === "number" ? result.reset : Date.now();

      return {
        allowed: result.success,
        remaining: Math.max(result.remaining, 0),
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((resetAt - Date.now()) / 1000),
        ),
        resetAt: new Date(resetAt),
      };
    } catch (error) {
      console.error("[rate-limit:shared-failed]", error);
    }
  }

  return consumeMemoryRateLimit(input);
}

export async function assertRateLimit(input: RateLimitInput) {
  const result = await consumeRateLimit(input);

  if (!result.allowed) {
    throw new RateLimitExceededError(result);
  }

  return result;
}

export function assertSharedRateLimitConfig(
  env: Record<string, string | undefined> = process.env,
) {
  const missing = getMissingSharedRateLimitEnv(env);

  if (isSharedRateLimitRequired(env) && missing.length > 0) {
    throw new Error(
      `Missing shared rate-limit environment variables: ${missing.join(", ")}`,
    );
  }
}

export function getMissingSharedRateLimitEnv(
  env: Record<string, string | undefined> = process.env,
) {
  return SHARED_RATE_LIMIT_ENV.filter((name) => !env[name]?.trim());
}

export function isSharedRateLimitRequired(
  env: Record<string, string | undefined> = process.env,
) {
  return (
    env.NODE_ENV === "production" &&
    (env.VERCEL === "1" || env.VERCEL_ENV === "production")
  );
}

export function resetRateLimitStateForTests() {
  buckets.clear();
  sharedLimiters.clear();
  sharedRedis = null;
}

export function createRateLimitKey(scope: string, identifier: string) {
  const normalized = identifier.trim().toLowerCase() || "unknown";
  const digest = createHash("sha256").update(normalized).digest("hex");

  return `${scope}:${digest.slice(0, 32)}`;
}

function consumeMemoryRateLimit(input: RateLimitInput): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(input.key);
  const activeBucket =
    bucket && bucket.resetAt > now
      ? bucket
      : { count: 0, resetAt: now + input.windowMs };

  activeBucket.count += 1;
  buckets.set(input.key, activeBucket);

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((activeBucket.resetAt - now) / 1000),
  );
  const remaining = Math.max(input.limit - activeBucket.count, 0);

  return {
    allowed: activeBucket.count <= input.limit,
    remaining,
    retryAfterSeconds,
    resetAt: new Date(activeBucket.resetAt),
  };
}

export function getRequestIp(req: Request) {
  return getHeadersIp(req.headers);
}

export function getHeadersIp(headers: Headers) {
  return normalizeRateLimitKeyPart(
    headers.get("x-forwarded-for")?.split(",")[0] ??
      headers.get("x-real-ip") ??
      "unknown",
  );
}

export function rateLimitMessage(error: unknown) {
  if (error instanceof RateLimitExceededError) {
    return `יותר מדי ניסיונות. נסו שוב בעוד ${error.retryAfterSeconds} שניות.`;
  }

  return null;
}

function getSharedLimiter(input: RateLimitInput) {
  assertSharedRateLimitConfig();

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) return null;

  sharedRedis ??= new Redis({ url, token });

  const windowSeconds = Math.max(1, Math.ceil(input.windowMs / 1000));
  const limiterKey = `${input.limit}:${windowSeconds}`;
  const existing = sharedLimiters.get(limiterKey);

  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: sharedRedis,
    limiter: Ratelimit.slidingWindow(input.limit, `${windowSeconds} s`),
    prefix: `aphrodite:rate-limit:${input.limit}:${windowSeconds}`,
  });

  sharedLimiters.set(limiterKey, limiter);

  return limiter;
}

function normalizeRateLimitKeyPart(value: string) {
  const normalized = value.trim();

  return normalized ? normalized.slice(0, 128) : "unknown";
}
