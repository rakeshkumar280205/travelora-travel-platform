import { describe, expect, it } from "vitest";

import {
  packageCreateSchema,
  publishPackageSchema,
} from "@/lib/validation/package-schemas";

const seasonalPrice = {
  seasonName: "Summer",
  startDate: "2026-04-01",
  endDate: "2026-06-01",
  amount: 45000,
  currency: "INR",
  pricingBasis: "per couple",
};

const itineraryDays = [
  { dayNumber: 1, title: "Arrival", description: "Airport transfer." },
  { dayNumber: 2, title: "Sightseeing", description: "Explore the city." },
];

const packageInput = {
  slug: "kerala-escape",
  title: "Kerala Escape",
  destination: "Kerala",
  durationDays: 2,
  description: "A short Kerala journey.",
  category: "Leisure",
  hotelCategory: "Premium",
  seasonalPrices: [seasonalPrice],
  itineraryDays,
};

describe("package validation", () => {
  it("accepts positive prices and rejects non-positive prices", () => {
    expect(packageCreateSchema.safeParse(packageInput).success).toBe(true);
    expect(
      packageCreateSchema.safeParse({
        ...packageInput,
        seasonalPrices: [{ ...seasonalPrice, amount: 0 }],
      }).success,
    ).toBe(false);
  });

  it("rejects overlapping or reversed seasonal ranges", () => {
    const overlapping = {
      ...packageInput,
      seasonalPrices: [
        seasonalPrice,
        { ...seasonalPrice, seasonName: "Monsoon", startDate: "2026-05-01" },
      ],
    };
    const reversed = {
      ...packageInput,
      seasonalPrices: [{ ...seasonalPrice, startDate: "2026-06-01", endDate: "2026-04-01" }],
    };

    expect(packageCreateSchema.safeParse(overlapping).success).toBe(false);
    expect(packageCreateSchema.safeParse(reversed).success).toBe(false);
  });

  it("requires complete sequential itinerary data for publishing", () => {
    expect(
      publishPackageSchema.safeParse({
        ...packageInput,
        seasonalPrices: [seasonalPrice],
        itineraryDays,
      }).success,
    ).toBe(true);
    expect(
      publishPackageSchema.safeParse({
        ...packageInput,
        itineraryDays: [
          { ...itineraryDays[0], dayNumber: 2 },
          { ...itineraryDays[1], dayNumber: 3 },
        ],
      }).success,
    ).toBe(false);
    expect(
      publishPackageSchema.safeParse({
        ...packageInput,
        seasonalPrices: [],
      }).success,
    ).toBe(false);
  });
});
