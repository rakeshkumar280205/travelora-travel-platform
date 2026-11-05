import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAdminPackages, duplicatePackage, publishPackage } = vi.hoisted(() => ({
  getAdminPackages: vi.fn(),
  duplicatePackage: vi.fn(),
  publishPackage: vi.fn(),
}));

vi.mock("@/server/repositories/package-repository", () => ({
  createPackage: vi.fn(),
  duplicatePackage,
  getDashboardData: vi.fn(),
  findPublishedPackageBySlug: vi.fn(),
  getPackageVersion: vi.fn(),
  listPackageVersions: vi.fn(),
  listRelatedPublishedPackages: vi.fn(),
  listAllPackages: getAdminPackages,
  listPublishedPackages: vi.fn(),
  publishPackage,
  rollbackPackage: vi.fn(),
  toSnapshot: vi.fn((value) => value),
  updatePackage: vi.fn(),
}));

import {
  duplicatePackageRecord,
  publishPackageRecord,
} from "@/server/services/package-service";

const packageRecord = {
  id: "package-1",
  slug: "kerala-escape",
  title: "Kerala Escape",
  destination: "Kerala",
  durationDays: 2,
  description: "A short journey.",
  category: "Leisure",
  hotelCategory: "Premium",
  seasonalPrices: [{
    id: "price-1",
    seasonName: "Summer",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-06-01"),
    amount: 45000,
    currency: "INR",
    pricingBasis: "per couple",
  }],
  itineraryDays: [
    { id: "day-1", dayNumber: 1, title: "Arrival", description: "Transfer." },
  ],
};

describe("package service workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    duplicatePackage.mockResolvedValue({ id: "copy-1", status: "DRAFT" });
    publishPackage.mockResolvedValue({ id: "version-2", versionNumber: 2 });
  });

  it("progresses duplicate slugs without changing the source", async () => {
    getAdminPackages.mockResolvedValue([
      packageRecord,
      { ...packageRecord, id: "package-2", slug: "kerala-escape-copy" },
      { ...packageRecord, id: "package-3", slug: "kerala-escape-copy-2" },
    ]);

    await duplicatePackageRecord("package-1");

    expect(duplicatePackage).toHaveBeenCalledWith("package-1", "kerala-escape-copy-3");
  });

  it("publishes only after the package has a valid price and itinerary", async () => {
    getAdminPackages.mockResolvedValue([packageRecord]);

    await publishPackageRecord("package-1", "admin-1");

    expect(publishPackage).toHaveBeenCalledWith(
      "package-1",
      "admin-1",
      expect.objectContaining({ title: "Kerala Escape" }),
    );
  });

  it("does not publish an incomplete draft", async () => {
    getAdminPackages.mockResolvedValue([{
      ...packageRecord,
      seasonalPrices: [],
      itineraryDays: [],
    }]);

    await expect(publishPackageRecord("package-1", "admin-1")).rejects.toThrow();
    expect(publishPackage).not.toHaveBeenCalled();
  });
});
