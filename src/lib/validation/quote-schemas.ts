import { z } from "zod";

export const quoteCreateSchema = z.object({
  enquiryId: z.string().trim().min(1).optional().nullable(),
  packageId: z.string().trim().min(1, "Package selection is required."),
  seasonalPriceId: z.string().trim().min(1).optional().nullable(),
  customerName: z.string().trim().min(2, "Customer name must be at least 2 characters.").max(120),
  customerEmail: z.string().trim().email("Customer email must be a valid email address."),
  customerPhone: z.string().trim().max(30).optional().nullable(),
  startDate: z.string().trim().min(1, "Travel date is required to identify the seasonal pricing rate."),
  durationDays: z.coerce.number().int().positive("Duration must be at least 1 day."),
  adults: z.coerce.number().int().min(1, "At least 1 adult traveller is required.").max(50),
  children: z.coerce.number().int().min(0, "Children count cannot be negative.").default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const quoteUpdateSchema = z.object({
  customerName: z.string().trim().min(2).max(120).optional(),
  customerEmail: z.string().trim().email().optional(),
  customerPhone: z.string().trim().max(30).optional().nullable(),
  startDate: z.string().trim().min(1).optional(),
  durationDays: z.coerce.number().int().positive().optional(),
  adults: z.coerce.number().int().min(1).max(50).optional(),
  children: z.coerce.number().int().min(0).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  seasonalPriceId: z.string().trim().min(1).optional().nullable(),
  status: z
    .enum(["DRAFT", "GENERATED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"])
    .optional(),
});

export const quoteListQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z
    .enum(["ALL", "DRAFT", "GENERATED", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"])
    .default("ALL"),
  packageId: z.string().trim().optional(),
  enquiryId: z.string().trim().optional(),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;
export type QuoteUpdateInput = z.infer<typeof quoteUpdateSchema>;
export type QuoteListQuery = z.infer<typeof quoteListQuerySchema>;

export type SeasonalPriceMatch = {
  id: string;
  seasonName: string;
  startDate: Date | string;
  endDate: Date | string;
  amount: number | string;
  currency: string;
  pricingBasis: string;
};

export class PricingIntegrityError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "PricingIntegrityError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Validates seasonal pricing for a package and travel start date.
 * Throws PricingIntegrityError if date is missing, outside configured seasons,
 * or ambiguous due to overlapping seasonal ranges.
 */
export function matchSeasonalPrice(
  seasons: SeasonalPriceMatch[],
  travelDateStr?: string | null,
  explicitSeasonId?: string | null
): SeasonalPriceMatch {
  if (!seasons || seasons.length === 0) {
    throw new PricingIntegrityError(
      "The selected journey has no published seasonal prices in the database.",
      "NO_SEASONAL_PRICES"
    );
  }

  // If consultant explicitly selected a season
  if (explicitSeasonId) {
    const matched = seasons.find((s) => s.id === explicitSeasonId);
    if (!matched) {
      throw new PricingIntegrityError(
        "The selected seasonal pricing tier does not belong to this journey.",
        "INVALID_SEASON_SELECTION"
      );
    }
    return matched;
  }

  if (!travelDateStr) {
    throw new PricingIntegrityError(
      "Travel date is required to determine the applicable seasonal rate. Please specify a travel start date.",
      "MISSING_TRAVEL_DATE"
    );
  }

  const travelDate = new Date(travelDateStr);
  if (isNaN(travelDate.getTime())) {
    throw new PricingIntegrityError(
      "Invalid travel date format. Expected a valid calendar date.",
      "INVALID_TRAVEL_DATE"
    );
  }

  // Look for matching seasonal windows
  const matchingSeasons = seasons.filter((season) => {
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return travelDate >= start && travelDate <= end;
  });

  if (matchingSeasons.length === 0) {
    const configuredWindows = seasons
      .map(
        (s) =>
          `"${s.seasonName}" (${new Date(s.startDate).toISOString().slice(0, 10)} to ${new Date(s.endDate).toISOString().slice(0, 10)})`
      )
      .join("; ");

    throw new PricingIntegrityError(
      `No seasonal pricing is configured for the requested travel date (${travelDateStr.slice(0, 10)}). Configured seasonal windows: ${configuredWindows}.`,
      "UNMATCHED_SEASONAL_DATE",
      { requestedDate: travelDateStr, configuredWindows }
    );
  }

  if (matchingSeasons.length > 1) {
    throw new PricingIntegrityError(
      `Multiple overlapping seasonal rates match ${travelDateStr.slice(0, 10)}. Please explicitly select the intended season.`,
      "AMBIGUOUS_SEASONAL_RATES",
      { matchingSeasonIds: matchingSeasons.map((s) => s.id) }
    );
  }

  const selected = matchingSeasons[0]!;
  const amount = Number(selected.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new PricingIntegrityError(
      `Seasonal rate "${selected.seasonName}" has an invalid non-positive amount (${selected.amount}).`,
      "INVALID_SEASONAL_AMOUNT"
    );
  }

  return selected;
}

export type QuoteCalculationResult = {
  quoteNumber: string;
  adultsCount: number;
  childrenCount: number;
  basePriceAmount: number;
  currency: string;
  pricingBasis: string;
  adultSubtotal: number;
  calculatedTotal: number;
  disclaimers: {
    gstStatus: string;
    childPricingPolicy: string;
    pricingBasisPolicy: string;
    validityPolicy: string;
    assumptions: string[];
    exclusions: string[];
  };
};

/**
 * Calculates quote pricing strictly from database-backed seasonal prices.
 * Does NOT invent child pricing, discounts, or GST treatment.
 */
export function calculateQuote(
  adults: number,
  children: number,
  season: SeasonalPriceMatch
): QuoteCalculationResult {
  const rate = Number(season.amount);
  const adultSubtotal = adults * rate;
  const calculatedTotal = adultSubtotal;

  return {
    quoteNumber: "",
    adultsCount: adults,
    childrenCount: children,
    basePriceAmount: rate,
    currency: season.currency,
    pricingBasis: season.pricingBasis,
    adultSubtotal,
    calculatedTotal,
    disclaimers: {
      gstStatus:
        "GST treatment is subject to confirmation upon final booking; indicative pricing excludes applicable GST.",
      childPricingPolicy:
        children > 0
          ? `${children} child traveller(s) remain unpriced in this indicative quote. Child rates are subject to direct confirmation based on hotel occupancy, extra bed requirements, and safari permits.`
          : "Child pricing is not applicable (0 children).",
      pricingBasisPolicy: `Published price basis: "${season.pricingBasis}". Sourced directly from season "${season.seasonName}".`,
      validityPolicy:
        "Indicative pricing only; rates and lodge availability remain subject to reconfirmation at the time of reservation request.",
      assumptions: [
        "Adult pricing is calculated directly as (Adults × Published Seasonal Rate).",
        "Children are not assumed to receive adult rates or flat discounts.",
        "No unverified flight segments, private charters, or unlisted excursions are included.",
      ],
      exclusions: [
        "Goods and Services Tax (GST) — to be finalized upon billing confirmation.",
        "Gratuities, personal travel insurance, and optional lodge activities.",
        "Visa fees and international or domestic airfare unless explicitly noted in package itinerary.",
      ],
    },
  };
}
