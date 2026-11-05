import { beforeEach, describe, expect, it, vi } from "vitest";

const { findPublishedPackageBySlug, createEnquiry } = vi.hoisted(() => ({
  findPublishedPackageBySlug: vi.fn(),
  createEnquiry: vi.fn(),
}));

vi.mock("@/server/repositories/package-repository", () => ({
  findPublishedPackageBySlug,
}));
vi.mock("@/server/repositories/enquiry-repository", () => ({
  createEnquiry,
}));

import { createPublicEnquiry } from "@/server/services/enquiry-service";

describe("public enquiry service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createEnquiry.mockResolvedValue({ id: "enquiry-1" });
  });

  it("uses the published package destination and preserves the message", async () => {
    findPublishedPackageBySlug.mockResolvedValue({
      id: "package-1",
      destination: "Kerala",
    });

    await createPublicEnquiry({
      customerName: "Asha Menon",
      email: "ASHA@EXAMPLE.TEST",
      phone: undefined,
      message: "Please suggest a relaxed itinerary.",
      packageSlug: "kerala-escape",
      destination: "Other",
      startDate: undefined,
      travelMonth: "2026-06",
      durationDays: 6,
      adults: 2,
      children: 1,
      budget: 75000,
      currency: undefined,
      website: "",
    });

    expect(createEnquiry).toHaveBeenCalledWith(expect.objectContaining({
      email: "asha@example.test",
      message: "Please suggest a relaxed itinerary.",
      destination: "Kerala",
      currency: "INR",
      package: { connect: { id: "package-1" } },
    }));
  });

  it("rejects unknown or unpublished package references", async () => {
    findPublishedPackageBySlug.mockResolvedValue(null);

    await expect(createPublicEnquiry({
      customerName: "Asha Menon",
      email: "asha@example.test",
      message: "Please suggest a relaxed itinerary.",
      packageSlug: "draft-package",
      destination: "Kerala",
      adults: 2,
      website: "",
    })).rejects.toThrow("PACKAGE_NOT_FOUND");
    expect(createEnquiry).not.toHaveBeenCalled();
  });
});
