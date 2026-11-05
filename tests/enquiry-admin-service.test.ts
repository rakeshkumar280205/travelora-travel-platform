import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  addEnquiryNote,
  findConsultant,
  findEnquiryById,
  saveEnquiryReply,
  updateEnquiry,
} = vi.hoisted(() => ({
  addEnquiryNote: vi.fn(),
  findConsultant: vi.fn(),
  findEnquiryById: vi.fn(),
  saveEnquiryReply: vi.fn(),
  updateEnquiry: vi.fn(),
}));
const { generateStructuredJson } = vi.hoisted(() => ({
  generateStructuredJson: vi.fn(),
}));
const { listPublishedPackages } = vi.hoisted(() => ({
  listPublishedPackages: vi.fn(),
}));

vi.mock("@/server/repositories/enquiry-repository", () => ({
  addEnquiryNote,
  findConsultant,
  findEnquiryById,
  listConsultants: vi.fn(),
  listEnquiries: vi.fn(),
  saveEnquiryReply,
  updateEnquiry,
}));
vi.mock("@/server/ai/gemini-service", () => ({
  generateStructuredJson,
  isGeminiServiceError: vi.fn(),
}));
vi.mock("@/server/repositories/package-repository", () => ({
  listPublishedPackages,
}));

import {
  addNoteForStaff,
  createAiReplyDraft,
  extractEnquiryRequirements,
  recommendPackagesForEnquiry,
  saveReplyForStaff,
  updateEnquiryForStaff,
} from "@/server/services/enquiry-admin-service";

const enquiry = {
  id: "enquiry-1",
  status: "NEW",
  assignedConsultantId: "consultant-a",
  destination: "Kerala",
  travelMonth: "2026-06",
  durationDays: 6,
  adults: 2,
  children: 1,
  budget: 75000,
  currency: "INR",
  message: "We would like a relaxed itinerary.",
  package: null,
};

const publishedPackages = [
  {
    id: "package-1",
    title: "Kerala Escape",
    slug: "kerala-escape",
    destination: "Kerala",
    durationDays: 6,
    hotelCategory: "Premium",
    seasonalPrices: [{ amount: "75000", currency: "INR", pricingBasis: "per couple" }],
  },
  {
    id: "package-2",
    title: "Tamil Nadu Highlights",
    slug: "tamil-nadu-highlights",
    destination: "Tamil Nadu",
    durationDays: 7,
    hotelCategory: "Premium",
    seasonalPrices: [{ amount: "90000", currency: "INR", pricingBasis: "per couple" }],
  },
];

describe("admin enquiry service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findEnquiryById.mockResolvedValue(enquiry);
    updateEnquiry.mockResolvedValue({ ...enquiry, status: "IN_PROGRESS" });
    findConsultant.mockResolvedValue({ id: "consultant-b", name: "Consultant B" });
    addEnquiryNote.mockResolvedValue({ id: "note-1", body: "Private note" });
    saveEnquiryReply.mockResolvedValue({ id: "reply-1", body: "Draft reply", isDraft: true });
    listPublishedPackages.mockResolvedValue(publishedPackages);
  });

  it("prevents an assigned consultant from assigning or accessing another enquiry", async () => {
    await expect(updateEnquiryForStaff({
      id: "enquiry-1",
      actorId: "consultant-a",
      actorRole: "CONSULTANT",
      assignedConsultantId: "consultant-b",
    })).rejects.toThrow("FORBIDDEN");

    findEnquiryById.mockResolvedValue({ ...enquiry, assignedConsultantId: "consultant-b" });
    await expect(addNoteForStaff("enquiry-1", "consultant-a", "Note", "CONSULTANT"))
      .rejects.toThrow("FORBIDDEN");
  });

  it("validates status transitions and records permitted updates", async () => {
    await expect(updateEnquiryForStaff({
      id: "enquiry-1",
      actorId: "admin-1",
      actorRole: "ADMIN",
      status: "CONVERTED",
    })).rejects.toThrow("INVALID_STATUS_TRANSITION");

    await updateEnquiryForStaff({
      id: "enquiry-1",
      actorId: "admin-1",
      actorRole: "ADMIN",
      status: "IN_PROGRESS",
      assignedConsultantId: "consultant-b",
    });

    expect(findConsultant).toHaveBeenCalledWith("consultant-b");
    expect(updateEnquiry).toHaveBeenCalledWith(
      "enquiry-1",
      expect.objectContaining({ status: "IN_PROGRESS" }),
      expect.objectContaining({ type: "STATUS_CHANGED" }),
    );
  });

  it("keeps notes private and reply drafts unsent", async () => {
    await addNoteForStaff("enquiry-1", "consultant-a", "Private note", "CONSULTANT");
    const reply = await saveReplyForStaff("enquiry-1", "consultant-a", "Draft reply", "CONSULTANT");

    expect(addEnquiryNote).toHaveBeenCalledWith("enquiry-1", "consultant-a", "Private note");
    expect(saveEnquiryReply).toHaveBeenCalledWith("enquiry-1", "consultant-a", "Draft reply");
    expect(reply).toEqual({ id: "reply-1", body: "Draft reply", isDraft: true });
  });

  it("filters AI recommendations to published database packages and caps them at three", async () => {
    generateStructuredJson.mockResolvedValue({
      recommendations: [
        { packageId: "package-1", matchingReasons: ["Destination match"], uncertainFit: [] },
        { packageId: "draft-package", matchingReasons: ["Model suggestion"], uncertainFit: [] },
        { packageId: "package-2", matchingReasons: ["Duration match"], uncertainFit: [] },
      ],
      noGoodMatchReason: null,
    });

    const result = await recommendPackagesForEnquiry("enquiry-1", "consultant-a", "CONSULTANT");

    expect(result.recommendations.map((item) => item.package.id))
      .toEqual(["package-1", "package-2"]);
    expect(result.recommendations[0].package.seasonalPrices[0].amount).toBe("75000");
  });

  it("preserves no-match explanations and returns no recommendations", async () => {
    generateStructuredJson.mockResolvedValue({
      recommendations: [],
      noGoodMatchReason: "Travel dates and budget need clarification.",
    });

    await expect(recommendPackagesForEnquiry("enquiry-1", "consultant-a", "CONSULTANT"))
      .resolves.toEqual({
        recommendations: [],
        noGoodMatchReason: "Travel dates and budget need clarification.",
      });
  });

  it("returns immediate empty recommendations when no published packages exist without calling AI", async () => {
    listPublishedPackages.mockResolvedValue([]);

    const result = await recommendPackagesForEnquiry("enquiry-1", "consultant-a", "CONSULTANT");

    expect(result).toEqual({
      recommendations: [],
      noGoodMatchReason: "No published packages are currently available to recommend.",
    });
    expect(generateStructuredJson).not.toHaveBeenCalled();
  });

  it("returns reviewable extraction suggestions without changing the enquiry", async () => {
    generateStructuredJson.mockResolvedValue({
      destination: "Kerala",
      travelStartDate: null,
      travelMonth: "2026-12",
      durationDays: 6,
      adults: 2,
      children: 1,
      budget: 120000,
      currency: "INR",
      hotelPreference: null,
      specialRequirements: ["Houseboat"],
      confidence: {
        destination: "high",
        travelStartDate: "unknown",
        travelMonth: "medium",
        durationDays: "medium",
        adults: "high",
        children: "high",
        budget: "medium",
        currency: "medium",
        hotelPreference: "unknown",
        specialRequirements: "high",
      },
      missingFields: ["travelStartDate"],
      uncertainFields: ["travelMonth", "budget"],
    });

    const result = await extractEnquiryRequirements("enquiry-1", "consultant-a", "CONSULTANT");

    expect(result).toMatchObject({
      destination: "Kerala",
      travelStartDate: null,
      adults: 2,
      children: 1,
      budget: 120000,
      specialRequirements: ["Houseboat"],
      source: "AI_SUGGESTION",
    });
    expect(updateEnquiry).not.toHaveBeenCalled();
  });

  it("creates an unsent AI reply draft through the existing reply repository", async () => {
    generateStructuredJson.mockResolvedValue({
      body: "Thank you. Our consultant will review your requirements.",
      uncertaintyNotes: ["Travel dates are not confirmed."],
    });

    const result = await createAiReplyDraft("enquiry-1", "consultant-a", "CONSULTANT");

    expect(saveEnquiryReply).toHaveBeenCalledWith(
      "enquiry-1",
      "consultant-a",
      "Thank you. Our consultant will review your requirements.",
    );
    expect(result).toMatchObject({ isDraft: true, unsent: true });
  });

  it("handles incomplete reply context without adding package claims", async () => {
    findEnquiryById.mockResolvedValue({
      ...enquiry,
      package: null,
      travelMonth: null,
      durationDays: null,
      budget: null,
      currency: null,
    });
    generateStructuredJson.mockResolvedValue({
      body: "Please share your preferred travel dates so our consultant can prepare options.",
      uncertaintyNotes: ["Dates and package pricing are not confirmed."],
    });

    const result = await createAiReplyDraft("enquiry-1", "consultant-a", "CONSULTANT");

    expect(result).toMatchObject({
      body: "Draft reply",
      uncertaintyNotes: ["Dates and package pricing are not confirmed."],
      unsent: true,
    });
    expect(saveEnquiryReply).toHaveBeenCalledWith(
      "enquiry-1",
      "consultant-a",
      "Please share your preferred travel dates so our consultant can prepare options.",
    );
  });

  it("blocks every AI operation for an unassigned consultant", async () => {
    findEnquiryById.mockResolvedValue({ ...enquiry, assignedConsultantId: "consultant-b" });

    await expect(extractEnquiryRequirements("enquiry-1", "consultant-a", "CONSULTANT"))
      .rejects.toThrow("FORBIDDEN");
    await expect(recommendPackagesForEnquiry("enquiry-1", "consultant-a", "CONSULTANT"))
      .rejects.toThrow("FORBIDDEN");
    await expect(createAiReplyDraft("enquiry-1", "consultant-a", "CONSULTANT"))
      .rejects.toThrow("FORBIDDEN");
    expect(generateStructuredJson).not.toHaveBeenCalled();
  });

  it("returns not-found for invalid enquiry identifiers before calling AI", async () => {
    findEnquiryById.mockResolvedValue(null);

    await expect(extractEnquiryRequirements("missing", "admin-1", "ADMIN"))
      .rejects.toThrow("ENQUIRY_NOT_FOUND");
    await expect(recommendPackagesForEnquiry("missing", "admin-1", "ADMIN"))
      .rejects.toThrow("ENQUIRY_NOT_FOUND");
    await expect(createAiReplyDraft("missing", "admin-1", "ADMIN"))
      .rejects.toThrow("ENQUIRY_NOT_FOUND");
    expect(generateStructuredJson).not.toHaveBeenCalled();
  });
});
