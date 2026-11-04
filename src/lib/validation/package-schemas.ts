import { z } from "zod";

const seasonalPriceSchema = z.object({
  seasonName: z.string().trim().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("INR"),
  pricingBasis: z.string().trim().min(1),
}).superRefine((price, context) => {
  if (price.startDate >= price.endDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be after the start date.",
    });
  }
});

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const packageFields = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  durationDays: z.number().int().positive(),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  hotelCategory: z.string().trim().min(1),
  seasonalPrices: z.array(seasonalPriceSchema).default([]),
  itineraryDays: z.array(itineraryDaySchema).default([]),
});

function validateSeasonalPrices(
  packageInput: { seasonalPrices?: Array<z.infer<typeof seasonalPriceSchema>> },
  context: z.RefinementCtx,
) {
  const prices = packageInput.seasonalPrices;
  if (!prices) return;
  for (let index = 0; index < prices.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < prices.length; otherIndex += 1) {
      const current = prices[index];
      const other = prices[otherIndex];
      if (current.startDate < other.endDate && other.startDate < current.endDate) {
        context.addIssue({
          code: "custom",
          path: ["seasonalPrices", otherIndex, "startDate"],
          message: "Seasonal date ranges cannot overlap.",
        });
      }
    }
  }
}

export const packageCreateSchema = packageFields.superRefine(validateSeasonalPrices);

export const packageUpdateSchema = packageFields.partial().superRefine(validateSeasonalPrices);

export type PackageCreateInput = z.infer<typeof packageCreateSchema>;
export type PackageUpdateInput = z.infer<typeof packageUpdateSchema>;

export const publishPackageSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  durationDays: z.number().int().positive(),
  seasonalPrices: z.array(seasonalPriceSchema).min(1),
  itineraryDays: z.array(itineraryDaySchema).min(1),
}).superRefine((packageInput, context) => {
  const dayNumbers = packageInput.itineraryDays.map((day) => day.dayNumber);
  const sortedDays = [...dayNumbers].sort((a, b) => a - b);
  if (
    new Set(dayNumbers).size !== dayNumbers.length ||
    sortedDays.some((day, index) => day !== index + 1)
  ) {
    context.addIssue({
      code: "custom",
      path: ["itineraryDays"],
      message: "Itinerary days must be unique and sequential starting at 1.",
    });
  }
  validateSeasonalPrices(packageInput, context);
});
