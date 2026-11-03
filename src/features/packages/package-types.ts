export type DiscoveryPackage = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  category: string;
  hotelCategory: string;
  seasonalPrices: Array<{
    id: string;
    seasonName: string;
    startDate: string;
    endDate: string;
    amount: string;
    currency: string;
    pricingBasis: string;
  }>;
  itineraryDays: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string;
  }>;
};

export function getPackageImage(destination: string) {
  const images: Record<string, string> = {
    Kerala:
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1400&q=85",
    "Tamil Nadu":
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=85",
  };

  return (
    images[destination] ??
    "https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?auto=format&fit=crop&w=1400&q=85"
  );
}

export function getLowestPrice(packageRecord: DiscoveryPackage) {
  const validPrices = packageRecord.seasonalPrices
    .map((price) => Number(price.amount))
    .filter((amount) => Number.isFinite(amount) && amount > 0);

  return validPrices.length > 0 ? Math.min(...validPrices) : null;
}

export function formatPrice(packageRecord: DiscoveryPackage) {
  const amount = getLowestPrice(packageRecord);
  if (amount === null) return null;

  const currency = packageRecord.seasonalPrices[0]?.currency ?? "INR";
  return formatAmount(amount, currency);
}

export function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
