import { connection } from "next/server";

import { presentPackages } from "@/server/services/package-presenter";
import { getPublishedPackages } from "@/server/services/package-service";
import type { DiscoveryPackage } from "@/features/packages/package-types";

export async function getDiscoveryPackages(): Promise<DiscoveryPackage[]> {
  await connection();
  const packages = await getPublishedPackages();

  return presentPackages(packages).map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    seasonalPrices: (item.seasonalPrices ?? []).map((price) => ({
      ...price,
      startDate: new Date(price.startDate).toISOString(),
      endDate: new Date(price.endDate).toISOString(),
    })),
    itineraryDays: item.itineraryDays ?? [],
  }));
}
