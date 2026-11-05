import "server-only";

import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { getRateLimitEnv } from "@/config/env";

type RateLimitScope = "public-enquiry" | "ai";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("RATE_LIMIT_UNAVAILABLE");
  }
}

let limiterCacheKey: string | null = null;
let publicLimiter: Ratelimit | null = null;
let aiLimiter: Ratelimit | null = null;

function parseDuration(value: string): Duration {
  if (!/^\d+(?:\.\d+)?\s?(?:ms|s|m|h|d)$/.test(value)) {
    throw new RateLimitUnavailableError();
  }
  return value as Duration;
}

function getLimiters() {
  const env = getRateLimitEnv();
  const hasUrl = Boolean(env.UPSTASH_REDIS_REST_URL);
  const hasToken = Boolean(env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasUrl && !hasToken) {
    // In production, distributed rate limiting via Upstash Redis is mandatory.
    // Failing closed prevents production from silently running without protection.
    if (process.env.NODE_ENV === "production") {
      throw new RateLimitUnavailableError();
    }
    return null;
  }
  if (!hasUrl || !hasToken) {
    throw new RateLimitUnavailableError();
  }

  const cacheKey = [
    env.UPSTASH_REDIS_REST_URL,
    env.UPSTASH_REDIS_REST_TOKEN,
    env.RATE_LIMIT_PUBLIC_ENQUIRY_MAX,
    env.RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW,
    env.RATE_LIMIT_AI_MAX,
    env.RATE_LIMIT_AI_WINDOW,
  ].join("|");
  if (limiterCacheKey === cacheKey && publicLimiter && aiLimiter) {
    return { publicLimiter, aiLimiter };
  }

  const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL!,
    token: env.UPSTASH_REDIS_REST_TOKEN!,
  });
  publicLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      env.RATE_LIMIT_PUBLIC_ENQUIRY_MAX,
      parseDuration(env.RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW),
    ),
    prefix: "travelora:public-enquiry",
  });
  aiLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      env.RATE_LIMIT_AI_MAX,
      parseDuration(env.RATE_LIMIT_AI_WINDOW),
    ),
    prefix: "travelora:ai",
  });
  limiterCacheKey = cacheKey;
  return { publicLimiter, aiLimiter };
}

function getClientIdentifier(request: Request) {
  if (process.env.VERCEL === "1") {
    const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwardedFor) return `ip:${forwardedFor}`;
  }
  return "ip:unknown";
}

export function getPublicEnquiryRateLimitKey(request: Request) {
  return getClientIdentifier(request);
}

export function getAiRateLimitKey(userId: string) {
  return `user:${userId}`;
}

export async function enforceRateLimit(
  scope: RateLimitScope,
  identifier: string,
): Promise<RateLimitResult> {
  const limiters = getLimiters();
  if (!limiters) return { allowed: true };

  try {
    const result = await (scope === "public-enquiry"
      ? limiters.publicLimiter
      : limiters.aiLimiter
    ).limit(identifier);
    return {
      allowed: result.success,
      retryAfterSeconds: result.success
        ? undefined
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  } catch {
    throw new RateLimitUnavailableError();
  }
}
