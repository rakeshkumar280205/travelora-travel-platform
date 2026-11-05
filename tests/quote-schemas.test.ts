import { describe, expect, it } from "vitest";
import {
  calculateQuote,
  matchSeasonalPrice,
  PricingIntegrityError,
  quoteCreateSchema,
  quoteUpdateSchema,
  type SeasonalPriceMatch,
} from "@/lib/validation/quote-schemas";

const sampleSeasons: SeasonalPriceMatch[] = [
  {
    id: "season-summer",
    seasonName: "Summer High Season",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-06-30"),
    amount: "45000",
    currency: "INR",
    pricingBasis: "Per person; indicative package price; GST treatment to be confirmed",
  },
  {
    id: "season-winter",
    seasonName: "Winter Peak Season",
    startDate: new Date("2026-10-01"),
    endDate: new Date("2026-12-31"),
    amount: "58000",
    currency: "INR",
    pricingBasis: "Per person; indicative package price; GST treatment to be confirmed",
  },
];

describe("quote schema validation and seasonal pricing integrity", () => {
  describe("Zod schema validation", () => {
    it("accepts valid quote creation input", () => {
      const valid = {
        packageId: "pkg-kerala",
        customerName: "Aarav Sharma",
        customerEmail: "aarav.sharma@example.com",
        customerPhone: "+91 98765 43210",
        startDate: "2026-05-15",
        durationDays: 5,
        adults: 2,
        children: 1,
      };
      expect(quoteCreateSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects non-positive adult counts or negative child counts", () => {
      const invalidAdults = {
        packageId: "pkg-kerala",
        customerName: "Aarav Sharma",
        customerEmail: "aarav.sharma@example.com",
        startDate: "2026-05-15",
        durationDays: 5,
        adults: 0,
      };
      expect(quoteCreateSchema.safeParse(invalidAdults).success).toBe(false);

      const negativeChildren = {
        packageId: "pkg-kerala",
        customerName: "Aarav Sharma",
        customerEmail: "aarav.sharma@example.com",
        startDate: "2026-05-15",
        durationDays: 5,
        adults: 2,
        children: -1,
      };
      expect(quoteCreateSchema.safeParse(negativeChildren).success).toBe(false);
    });

    it("validates quote status update values", () => {
      expect(quoteUpdateSchema.safeParse({ status: "SENT" }).success).toBe(true);
      expect(quoteUpdateSchema.safeParse({ status: "ACCEPTED" }).success).toBe(true);
      expect(quoteUpdateSchema.safeParse({ status: "INVALID_STATUS" }).success).toBe(false);
    });
  });

  describe("Seasonal Price Matching (Price Integrity)", () => {
    it("correctly matches travel date within summer seasonal window", () => {
      const matched = matchSeasonalPrice(sampleSeasons, "2026-05-10");
      expect(matched.id).toBe("season-summer");
      expect(matched.amount).toBe("45000");
    });

    it("correctly matches travel date within winter seasonal window", () => {
      const matched = matchSeasonalPrice(sampleSeasons, "2026-11-20");
      expect(matched.id).toBe("season-winter");
      expect(matched.amount).toBe("58000");
    });

    it("throws MISSING_TRAVEL_DATE when date is omitted without explicit season", () => {
      expect(() => matchSeasonalPrice(sampleSeasons, null)).toThrowError(
        PricingIntegrityError
      );
      try {
        matchSeasonalPrice(sampleSeasons, null);
      } catch (err) {
        expect((err as PricingIntegrityError).code).toBe("MISSING_TRAVEL_DATE");
      }
    });

    it("blocks quote generation when travel date falls outside any configured season", () => {
      // Monsoon month (July) not configured in sampleSeasons
      try {
        matchSeasonalPrice(sampleSeasons, "2026-07-15");
        expect.unreachable("Should have thrown PricingIntegrityError");
      } catch (err) {
        expect(err).toBeInstanceOf(PricingIntegrityError);
        const pie = err as PricingIntegrityError;
        expect(pie.code).toBe("UNMATCHED_SEASONAL_DATE");
        expect(pie.message).toContain("No seasonal pricing is configured");
        expect(pie.message).toContain("Summer High Season");
      }
    });

    it("detects and blocks ambiguous overlapping seasonal rates", () => {
      const overlappingSeasons: SeasonalPriceMatch[] = [
        {
          id: "s1",
          seasonName: "Festival Season",
          startDate: new Date("2026-10-01"),
          endDate: new Date("2026-11-15"),
          amount: "60000",
          currency: "INR",
          pricingBasis: "Per person",
        },
        {
          id: "s2",
          seasonName: "Autumn Window",
          startDate: new Date("2026-10-15"),
          endDate: new Date("2026-11-30"),
          amount: "55000",
          currency: "INR",
          pricingBasis: "Per person",
        },
      ];

      // Date 2026-10-20 falls into both s1 and s2
      try {
        matchSeasonalPrice(overlappingSeasons, "2026-10-20");
        expect.unreachable("Should have thrown PricingIntegrityError");
      } catch (err) {
        expect((err as PricingIntegrityError).code).toBe("AMBIGUOUS_SEASONAL_RATES");
      }
    });

    it("rejects non-positive seasonal prices", () => {
      const invalidRate: SeasonalPriceMatch[] = [
        {
          id: "free-season",
          seasonName: "Zero Price Season",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-03-31"),
          amount: "0",
          currency: "INR",
          pricingBasis: "Per person",
        },
      ];

      expect(() => matchSeasonalPrice(invalidRate, "2026-02-01")).toThrowError(
        /non-positive amount/
      );
    });
  });

  describe("Quote Calculation and Assumptions", () => {
    it("calculates adult pricing transparently and leaves children unpriced", () => {
      const season = sampleSeasons[0]!; // 45,000 INR
      const calc = calculateQuote(3, 2, season);

      // Adults: 3 * 45,000 = 135,000
      expect(calc.adultsCount).toBe(3);
      expect(calc.basePriceAmount).toBe(45000);
      expect(calc.adultSubtotal).toBe(135000);
      expect(calc.calculatedTotal).toBe(135000);

      // Children: 2, must be unpriced
      expect(calc.childrenCount).toBe(2);
      expect(calc.disclaimers.childPricingPolicy).toContain("2 child traveller(s) remain unpriced");

      // GST disclaimer: must state subject to confirmation
      expect(calc.disclaimers.gstStatus).toContain("GST treatment is subject to confirmation");
    });

    it("handles zero children scenario cleanly", () => {
      const season = sampleSeasons[1]!; // 58,000 INR
      const calc = calculateQuote(2, 0, season);

      expect(calc.adultsCount).toBe(2);
      expect(calc.adultSubtotal).toBe(116000);
      expect(calc.childrenCount).toBe(0);
      expect(calc.disclaimers.childPricingPolicy).toContain("not applicable (0 children)");
    });
  });
});
