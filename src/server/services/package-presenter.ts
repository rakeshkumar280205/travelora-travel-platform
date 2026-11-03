import "server-only";

export function presentPackage(packageRecord: {
  id: string;
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  category: string;
  hotelCategory: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  seasonalPrices: Array<{
    id: string;
    seasonName: string;
    startDate: Date;
    endDate: Date;
    amount: unknown;
    currency: string;
    pricingBasis: string;
  }>;
  itineraryDays: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string;
  }>;
}) {
  return {
    ...packageRecord,
    seasonalPrices: packageRecord.seasonalPrices.map((price) => ({
      ...price,
      amount: String(price.amount),
    })),
  };
}

export function presentPackages(
  packageRecords: Parameters<typeof presentPackage>[0][]
) {
  return packageRecords.map(presentPackage);
}
