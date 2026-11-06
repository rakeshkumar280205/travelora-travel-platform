import { describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    package: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma }));

import {
  findPublishedPackageBySlug,
  listPublishedPackages,
} from "@/server/repositories/package-repository";
import { presentPackage, presentPackages } from "@/server/services/package-presenter";

describe("package repository & presenter data resilience", () => {
  it("safely falls back when a publishedVersion snapshot is missing seasonalPrices or itineraryDays", async () => {
    prisma.package.findMany.mockResolvedValueOnce([
      {
        id: "pkg-1",
        slug: "PKG-KL-07",
        title: "Munnar, Thekkady and Alleppey Houseboat",
        destination: "Kerala",
        durationDays: 6,
        description: "A six-day Kerala journey.",
        category: "Kerala",
        hotelCategory: "4-star",
        status: "PUBLISHED",
        createdAt: new Date("2026-11-01"),
        updatedAt: new Date("2026-11-05"),
        publishedVersion: {
          id: "version-1",
          versionNumber: 1,
          snapshot: {
            slug: "PKG-KL-07",
            title: "Munnar, Thekkady and Alleppey Houseboat",
            destination: "Kerala",
            durationDays: 6,
            description: "A six-day Kerala journey.",
            category: "Kerala",
            hotelCategory: "4-star",
            // Notice: seasonalPrices and itineraryDays are omitted from this snapshot
          },
        },
        seasonalPrices: [
          {
            id: "sp-1",
            seasonName: "Peak Season",
            startDate: new Date("2026-10-01"),
            endDate: new Date("2027-03-31"),
            amount: 32500,
            currency: "INR",
            pricingBasis: "Per person",
          },
        ],
        itineraryDays: [
          {
            id: "day-1",
            dayNumber: 1,
            title: "Arrival in Cochin",
            description: "Chauffeur transfer to Munnar.",
          },
        ],
      },
    ]);

    const result = await listPublishedPackages();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("PKG-KL-07");
    // Verifies seasonalPrices and itineraryDays fallback from package relations
    expect(result[0].seasonalPrices).toHaveLength(1);
    expect(result[0].seasonalPrices[0].seasonName).toBe("Peak Season");
    expect(result[0].itineraryDays).toHaveLength(1);
    expect(result[0].itineraryDays[0].title).toBe("Arrival in Cochin");

    // Verifies presentPackage can process it without throwing TypeError
    const presented = presentPackages(result);
    expect(presented[0].seasonalPrices[0].amount).toBe("32500");
  });

  it("findPublishedPackageBySlug returns null for non-existent slug", async () => {
    prisma.package.findFirst.mockResolvedValueOnce(null);

    const result = await findPublishedPackageBySlug("INVALID-SLUG-99");
    expect(result).toBeNull();
  });

  it("presentPackage safely handles package with undefined seasonalPrices and itineraryDays", () => {
    const raw = {
      id: "pkg-raw",
      slug: "raw-journey",
      title: "Raw Journey",
      destination: "Tamil Nadu",
      durationDays: 3,
      description: "Description",
      category: "Heritage",
      hotelCategory: "Heritage Hotel",
      status: "PUBLISHED",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const presented = presentPackage(raw as unknown as Parameters<typeof presentPackage>[0]);
    expect(presented.seasonalPrices).toEqual([]);
    expect(presented.itineraryDays).toEqual([]);
  });
});
