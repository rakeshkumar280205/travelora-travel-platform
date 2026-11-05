import { describe, expect, it, vi } from "vitest";

const { connection } = vi.hoisted(() => ({ connection: vi.fn() }));
const { extractEnquiryRequirements, getEnquiryStaffAccess, isGeminiServiceError } =
  vi.hoisted(() => ({
    extractEnquiryRequirements: vi.fn(),
    getEnquiryStaffAccess: vi.fn(),
    isGeminiServiceError: vi.fn(),
  }));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/services/enquiry-admin-service", () => ({
  extractEnquiryRequirements,
  isGeminiServiceError,
}));
vi.mock("@/server/services/enquiry-access", () => ({ getEnquiryStaffAccess }));

import { POST } from "@/app/api/admin/enquiries/[id]/extract/route";

describe("extraction API route", () => {
  it("returns a generic error without internal diagnostic details", async () => {
    getEnquiryStaffAccess.mockResolvedValue({
      session: { user: { id: "admin-1" } },
      role: "ADMIN",
    });
    const internalError = new Error("AI_SCHEMA_INVALID");
    extractEnquiryRequirements.mockRejectedValue(internalError);
    isGeminiServiceError.mockReturnValue(true);

    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ id: "enquiry-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: {
        code: "SERVICE_UNAVAILABLE",
        message:
          "AI suggestions are temporarily unavailable. Review the enquiry manually or try again.",
      },
    });
    expect(JSON.stringify(body)).not.toContain("AI_SCHEMA_INVALID");
  });
});
