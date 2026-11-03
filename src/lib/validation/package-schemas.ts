import { z } from "zod";

const seasonalPriceSchema = z.object({
  seasonName: z.string().trim().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).default("INR"),
  pricingBasis: z.string().trim().min(1),
});

const itineraryDaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

export const packageCreateSchema = z.object({
  slug: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  durationDays: z.number().int().positive(),
  description: z.string().trim().min(1),
  category: z.string().trim().min(1),
  hotelCategory: z.string().trim().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seasonalPrices: z.array(seasonalPriceSchema).default([]),
  itineraryDays: z.array(itineraryDaySchema).default([]),
});

export const packageUpdateSchema = packageCreateSchema.partial();

export type PackageCreateInput = z.infer<typeof packageCreateSchema>;
export type PackageUpdateInput = z.infer<typeof packageUpdateSchema>;
