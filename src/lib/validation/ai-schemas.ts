import { z } from "zod";

const confidenceEnum = z.enum(["high", "medium", "low", "unknown"]);

export const confidenceSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (["high", "medium", "low", "unknown"].includes(lower)) {
      return lower;
    }
  }
  return val;
}, confidenceEnum);

const nullableStringSchema = (maxLen: number) =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === "null") return null;
      return trimmed;
    }
    return val;
  }, z.string().trim().max(maxLen).nullable());

const nullableTravelMonthSchema = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return null;
    return trimmed;
  }
  return val;
}, z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable());

const nullableCurrencySchema = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return null;
    return trimmed.toUpperCase();
  }
  return val;
}, z.string().regex(/^[A-Z]{3}$/).nullable());

const nullableIntSchema = (min: number, max: number) =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === null) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === "null") return null;
      if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
    }
    return val;
  }, z.number().int().min(min).max(max).nullable());

const nullableBudgetSchema = z.preprocess((val) => {
  if (val === undefined) return undefined;
  if (val === null) return null;
  if (typeof val === "string") {
    const trimmed = val.trim().replace(/,/g, "");
    if (!trimmed || trimmed.toLowerCase() === "null") return null;
    if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
  }
  return val;
}, z.number().nonnegative().max(100_000_000).nullable());

const stringArraySchema = (maxItemLen: number, maxItems: number) =>
  z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === null) return [];
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed ? [trimmed] : [];
    }
    if (Array.isArray(val)) {
      return val
        .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
        .filter(Boolean);
    }
    return val;
  }, z.array(z.string().trim().min(1).max(maxItemLen)).max(maxItems));

export const extractedRequirementsSchema = z.object({
  destination: nullableStringSchema(120),
  travelStartDate: nullableStringSchema(30),
  travelMonth: nullableTravelMonthSchema,
  durationDays: nullableIntSchema(1, 365),
  adults: nullableIntSchema(1, 50),
  children: nullableIntSchema(0, 50),
  budget: nullableBudgetSchema,
  currency: nullableCurrencySchema,
  hotelPreference: nullableStringSchema(120),
  specialRequirements: stringArraySchema(500, 20),
  confidence: z.object({
    destination: confidenceSchema,
    travelStartDate: confidenceSchema,
    travelMonth: confidenceSchema,
    durationDays: confidenceSchema,
    adults: confidenceSchema,
    children: confidenceSchema,
    budget: confidenceSchema,
    currency: confidenceSchema,
    hotelPreference: confidenceSchema,
    specialRequirements: confidenceSchema,
  }),
  missingFields: stringArraySchema(80, 20),
  uncertainFields: stringArraySchema(80, 20),
});

export const recommendationResponseSchema = z.object({
  recommendations: z.preprocess(
    (val) => (val == null ? [] : val),
    z.array(
      z.object({
        packageId: z.string().trim().min(1),
        matchingReasons: stringArraySchema(300, 5),
        uncertainFit: stringArraySchema(300, 5),
      })
    ).max(3)
  ),
  noGoodMatchReason: nullableStringSchema(500),
});

export const aiReplySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  uncertaintyNotes: stringArraySchema(300, 10),
});

export type ExtractedRequirements = z.infer<typeof extractedRequirementsSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
export type AiReply = z.infer<typeof aiReplySchema>;
