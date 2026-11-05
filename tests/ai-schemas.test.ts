import { describe, expect, it } from "vitest";

import {
  aiReplySchema,
  extractedRequirementsSchema,
  recommendationResponseSchema,
} from "@/lib/validation/ai-schemas";

describe("AI response schemas", () => {
  it("accepts a fully valid extraction result with explicit nullable values", () => {
    const result = extractedRequirementsSchema.safeParse({
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
      confidence: Object.fromEntries([
        "destination", "travelStartDate", "travelMonth", "durationDays",
        "adults", "children", "budget", "currency", "hotelPreference",
        "specialRequirements",
      ].map((key) => [key, key === "destination" ? "high" : "medium"])),
      missingFields: ["travelStartDate"],
      uncertainFields: ["durationDays"],
    });

    expect(result.success).toBe(true);
  });

  it("normalizes provider casing and empty string nullable representations", () => {
    const rawFromProvider = {
      destination: "Kerala",
      travelStartDate: "", // model outputs empty string instead of null
      travelMonth: "2026-12",
      durationDays: "6", // model outputs string number
      adults: "2",
      children: "0",
      budget: "120000",
      currency: "inr", // model outputs lowercase
      hotelPreference: "",
      specialRequirements: ["Backwaters"],
      confidence: {
        destination: "HIGH", // model outputs uppercase
        travelStartDate: "UNKNOWN",
        travelMonth: "Medium",
        durationDays: "high",
        adults: "HIGH",
        children: "HIGH",
        budget: "MEDIUM",
        currency: "HIGH",
        hotelPreference: "UNKNOWN",
        specialRequirements: "medium",
      },
      missingFields: null, // model outputs null for empty array
      uncertainFields: [],
    };

    const parsed = extractedRequirementsSchema.safeParse(rawFromProvider);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.travelStartDate).toBeNull();
      expect(parsed.data.hotelPreference).toBeNull();
      expect(parsed.data.currency).toBe("INR");
      expect(parsed.data.durationDays).toBe(6);
      expect(parsed.data.adults).toBe(2);
      expect(parsed.data.children).toBe(0);
      expect(parsed.data.budget).toBe(120000);
      expect(parsed.data.confidence.destination).toBe("high");
      expect(parsed.data.confidence.travelStartDate).toBe("unknown");
      expect(parsed.data.confidence.travelMonth).toBe("medium");
      expect(parsed.data.missingFields).toEqual([]);
    }
  });

  it("rejects undetermined extraction formats instead of accepting ambiguous values", () => {
    const valid = {
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
      confidence: Object.fromEntries([
        "destination", "travelStartDate", "travelMonth", "durationDays",
        "adults", "children", "budget", "currency", "hotelPreference",
        "specialRequirements",
      ].map((key) => [key, "medium"])),
      missingFields: [],
      uncertainFields: [],
    };

    expect(extractedRequirementsSchema.safeParse({ ...valid, travelMonth: "December" }).success)
      .toBe(false);
    expect(extractedRequirementsSchema.safeParse({ ...valid, durationDays: "5-6 nights" }).success)
      .toBe(false);
    expect(extractedRequirementsSchema.safeParse({ ...valid, currency: "₹" }).success)
      .toBe(false);
    expect(extractedRequirementsSchema.safeParse({
      ...valid,
      confidence: { ...valid.confidence, budget: undefined },
    }).success).toBe(false);
    const missingNullableField = Object.fromEntries(
      Object.entries(valid).filter(([key]) => key !== "hotelPreference"),
    );
    expect(extractedRequirementsSchema.safeParse(missingNullableField).success).toBe(false);
  });

  it("rejects invented recommendation prices and more than three recommendations", () => {
    const result = recommendationResponseSchema.safeParse({
      recommendations: Array.from({ length: 4 }, (_, index) => ({
        packageId: `package-${index}`,
        matchingReasons: ["Destination match"],
        uncertainFit: [],
        price: 100,
      })),
      noGoodMatchReason: null,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid recommendation response and handles null/empty reason", () => {
    const validResponse = {
      recommendations: [
        {
          packageId: "pkg-1",
          matchingReasons: ["Great match for Kerala"],
          uncertainFit: [],
        },
      ],
      noGoodMatchReason: null,
    };
    expect(recommendationResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it("requires a non-empty reply body and handles empty uncertaintyNotes", () => {
    expect(aiReplySchema.safeParse({ body: "", uncertaintyNotes: [] }).success).toBe(false);
    expect(aiReplySchema.safeParse({ body: "Draft reply", uncertaintyNotes: [] }).success).toBe(true);
    expect(aiReplySchema.safeParse({ body: "Draft reply", uncertaintyNotes: null }).success).toBe(true);
  });
});
