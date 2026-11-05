import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection } = vi.hoisted(() => ({ connection: vi.fn() }));
const {
  createAiReplyDraft,
  enforceRateLimit,
  getEnquiryStaffAccess,
  getAiRateLimitKey,
  isGeminiServiceError,
  recommendPackagesForEnquiry,
  RateLimitUnavailableError,
} = vi.hoisted(() => ({
  createAiReplyDraft: vi.fn(),
  enforceRateLimit: vi.fn(),
  getEnquiryStaffAccess: vi.fn(),
  getAiRateLimitKey: vi.fn(() => "user:admin-1"),
  isGeminiServiceError: vi.fn(),
  recommendPackagesForEnquiry: vi.fn(),
  RateLimitUnavailableError: class RateLimitUnavailableError extends Error {},
}));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/services/enquiry-admin-service", () => ({
  createAiReplyDraft,
  isGeminiServiceError,
  recommendPackagesForEnquiry,
}));
vi.mock("@/server/services/enquiry-access", () => ({ getEnquiryStaffAccess }));
vi.mock("@/server/services/rate-limit", () => ({
  enforceRateLimit,
  getAiRateLimitKey,
  RateLimitUnavailableError,
}));

import { POST as recommendationsPost } from "@/app/api/admin/enquiries/[id]/recommendations/route";
import { POST as replyPost } from "@/app/api/admin/enquiries/[id]/ai-reply/route";

const context = { params: Promise.resolve({ id: "enquiry-1" }) };

describe("recommendation and AI reply API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getEnquiryStaffAccess.mockResolvedValue({
      session: { user: { id: "admin-1" } },
      role: "ADMIN",
    });
    enforceRateLimit.mockResolvedValue({ allowed: true });
    isGeminiServiceError.mockReturnValue(false);
  });

  it("returns published recommendation data with the expected status", async () => {
    recommendPackagesForEnquiry.mockResolvedValue({
      recommendations: [{
        package: {
          id: "package-1",
          title: "Kerala Escape",
          seasonalPrices: [{ amount: "75000", currency: "INR" }],
        },
        matchingReasons: ["Destination match"],
        uncertainFit: ["Dates need confirmation"],
      }],
      noGoodMatchReason: null,
    });

    const response = await recommendationsPost(new Request("http://localhost"), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: expect.objectContaining({
        recommendations: expect.arrayContaining([
          expect.objectContaining({ package: expect.objectContaining({ id: "package-1" }) }),
        ]),
      }),
    });
  });

  it("returns a generic 503 for recommendation provider failures", async () => {
    recommendPackagesForEnquiry.mockRejectedValue(new Error("AI_SCHEMA_INVALID"));
    isGeminiServiceError.mockReturnValue(true);

    const response = await recommendationsPost(new Request("http://localhost"), context);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("AI_SCHEMA_INVALID");
  });

  it("returns a safe 429 when an AI request exceeds its limit", async () => {
    enforceRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 20 });

    const response = await recommendationsPost(new Request("http://localhost"), context);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("20");
    expect(recommendPackagesForEnquiry).not.toHaveBeenCalled();
  });

  it("creates an unsent reply draft with HTTP 201", async () => {
    createAiReplyDraft.mockResolvedValue({
      id: "reply-1",
      body: "We will confirm dates with you.",
      isDraft: true,
      unsent: true,
      uncertaintyNotes: ["Availability is not confirmed."],
    });

    const response = await replyPost(new Request("http://localhost"), context);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      data: expect.objectContaining({ isDraft: true, unsent: true }),
    });
  });

  it("denies EDITOR access before invoking protected AI services", async () => {
    getEnquiryStaffAccess.mockResolvedValue({
      session: { user: { id: "editor-1" } },
      role: "FORBIDDEN",
    });

    const [recommendationsResponse, replyResponse] = await Promise.all([
      recommendationsPost(new Request("http://localhost"), context),
      replyPost(new Request("http://localhost"), context),
    ]);

    expect(recommendationsResponse.status).toBe(403);
    expect(replyResponse.status).toBe(403);
    expect(recommendPackagesForEnquiry).not.toHaveBeenCalled();
    expect(createAiReplyDraft).not.toHaveBeenCalled();
  });

  it("returns 503 when the AI limiter is unavailable", async () => {
    enforceRateLimit.mockRejectedValue(new RateLimitUnavailableError());

    const response = await replyPost(new Request("http://localhost"), context);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(createAiReplyDraft).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated AI requests", async () => {
    getEnquiryStaffAccess.mockResolvedValue({ session: null, role: "FORBIDDEN" });

    const response = await recommendationsPost(new Request("http://localhost"), context);

    expect(response.status).toBe(401);
    expect(recommendPackagesForEnquiry).not.toHaveBeenCalled();
  });
});
