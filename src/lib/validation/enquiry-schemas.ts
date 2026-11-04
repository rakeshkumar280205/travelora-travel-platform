import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional(),
  );

export const publicEnquirySchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: optionalText(25).refine(
    (value) => value === undefined || /^\+?[0-9\s().-]{7,20}$/.test(value),
    "Enter a valid phone number.",
  ),
  message: z.string().trim().min(10).max(4000),
  packageSlug: optionalText(120).refine(
    (value) => value === undefined || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Package reference is invalid.",
  ),
  destination: z.string().trim().min(2).max(120),
  startDate: z.preprocess(
    emptyToUndefined,
    z.coerce.date().optional(),
  ),
  travelMonth: optionalText(7).refine(
    (value) => value === undefined || /^\d{4}-(0[1-9]|1[0-2])$/.test(value),
    "Preferred month is invalid.",
  ),
  durationDays: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().positive().max(365).optional(),
  ),
  adults: z.coerce.number().int().min(1).max(50),
  children: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).max(50).optional(),
  ),
  budget: z.preprocess(
    emptyToUndefined,
    z.coerce.number().finite().nonnegative().max(100_000_000).optional(),
  ),
  currency: optionalText(3).refine(
    (value) => value === undefined || /^[A-Z]{3}$/.test(value),
    "Currency must be a three-letter code.",
  ),
  website: z.string().trim().max(0).optional(),
});

export type PublicEnquiryInput = z.infer<typeof publicEnquirySchema>;
