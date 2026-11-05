import { beforeEach, describe, expect, it, vi } from "vitest";

const { getRateLimitEnv, limit, Redis, Ratelimit } = vi.hoisted(() => ({
  getRateLimitEnv: vi.fn(),
  limit: vi.fn(),
  Redis: vi.fn(),
  Ratelimit: Object.assign(
    vi.fn(() => ({ limit })),
    { slidingWindow: vi.fn((max: number, window: string) => ({ max, window })) },
  ),
}));

vi.mock("@/config/env", () => ({ getRateLimitEnv }));
vi.mock("@upstash/redis", () => ({ Redis }));
vi.mock("@upstash/ratelimit", () => ({ Ratelimit }));

import {
  enforceRateLimit,
  RateLimitUnavailableError,
} from "@/server/services/rate-limit";

const configured = {
  UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "test-token",
  RATE_LIMIT_PUBLIC_ENQUIRY_MAX: 5,
  RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW: "1 h",
  RATE_LIMIT_AI_MAX: 10,
  RATE_LIMIT_AI_WINDOW: "1 m",
};

describe("distributed rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getRateLimitEnv.mockReturnValue(configured);
  });

  it("allows requests when the provider allows them", async () => {
    limit.mockResolvedValue({ success: true, reset: Date.now() + 60_000 });

    await expect(enforceRateLimit("public-enquiry", "ip:test"))
      .resolves.toEqual({ allowed: true, retryAfterSeconds: undefined });
  });

  it("returns a bounded retry delay when the provider rejects a request", async () => {
    limit.mockResolvedValue({ success: false, reset: Date.now() + 12_000 });

    await expect(enforceRateLimit("ai", "user:test"))
      .resolves.toMatchObject({ allowed: false, retryAfterSeconds: 12 });
  });

  it("fails safely when the configured provider is unavailable", async () => {
    limit.mockRejectedValue(new Error("provider unavailable"));

    await expect(enforceRateLimit("ai", "user:test"))
      .rejects.toBeInstanceOf(RateLimitUnavailableError);
  });

  it("does not activate without both provider credentials in non-production", async () => {
    getRateLimitEnv.mockReturnValue({
      ...configured,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    });

    await expect(enforceRateLimit("public-enquiry", "ip:test"))
      .resolves.toEqual({ allowed: true });
    expect(limit).not.toHaveBeenCalled();
  });

  it("throws RateLimitUnavailableError in production when provider credentials are missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    getRateLimitEnv.mockReturnValue({
      ...configured,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
    });

    try {
      await expect(enforceRateLimit("public-enquiry", "ip:test"))
        .rejects.toBeInstanceOf(RateLimitUnavailableError);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
