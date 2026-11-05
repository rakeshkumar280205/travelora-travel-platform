import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection } = vi.hoisted(() => ({ connection: vi.fn() }));
const { createPublicEnquiry } = vi.hoisted(() => ({ createPublicEnquiry: vi.fn() }));
const { enforceRateLimit, getPublicEnquiryRateLimitKey, RateLimitUnavailableError } =
  vi.hoisted(() => ({
    enforceRateLimit: vi.fn(),
    getPublicEnquiryRateLimitKey: vi.fn(() => "ip:test"),
    RateLimitUnavailableError: class RateLimitUnavailableError extends Error {},
  }));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/services/enquiry-service", () => ({ createPublicEnquiry }));
vi.mock("@/server/services/rate-limit", () => ({
  enforceRateLimit,
  getPublicEnquiryRateLimitKey,
  RateLimitUnavailableError,
}));

import { POST } from "@/app/api/enquiries/route";

const validBody = {
  customerName: "Test Traveller",
  email: "traveller@example.com",
  message: "I would like to plan a Kerala journey.",
  destination: "Kerala",
  adults: 2,
  website: "",
};

describe("public enquiry rate limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimit.mockResolvedValue({ allowed: true });
  });

  it("allows valid business requests when the limiter allows them", async () => {
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    }));

    expect(response.status).toBe(201);
    expect(createPublicEnquiry).toHaveBeenCalledTimes(1);
  });

  it("returns a safe 429 when the public limit is exceeded", async () => {
    enforceRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 30 });

    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    });
    expect(createPublicEnquiry).not.toHaveBeenCalled();
  });

  it("returns 503 without exposing provider details when the limiter is unavailable", async () => {
    enforceRateLimit.mockRejectedValue(new RateLimitUnavailableError());

    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody),
    }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("Upstash");
    expect(createPublicEnquiry).not.toHaveBeenCalled();
  });

  it("preserves existing validation after the limiter allows the request", async () => {
    const response = await POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ ...validBody, email: "invalid" }),
    }));

    expect(response.status).toBe(400);
    expect(createPublicEnquiry).not.toHaveBeenCalled();
  });
});
