const buckets = new Map<string, { count: number; resetAt: number }>();

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

export function consumeRateLimit(input: RateLimitInput): RateLimitResult {
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

export function assertRateLimit(input: RateLimitInput) {
  const result = consumeRateLimit(input);

  if (!result.allowed) {
    throw new RateLimitExceededError(result);
  }

  return result;
}

export function getRequestIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimitMessage(error: unknown) {
  if (error instanceof RateLimitExceededError) {
    return `יותר מדי ניסיונות. נסו שוב בעוד ${error.retryAfterSeconds} שניות.`;
  }

  return null;
}
