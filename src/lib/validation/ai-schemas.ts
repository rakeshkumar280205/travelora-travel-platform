import { z } from "zod";

const confidenceSchema = z.enum(["high", "medium", "low", "unknown"]);

export const extractedRequirementsSchema = z.object({
  destination: z.string().trim().max(120).nullable(),
  travelStartDate: z.string().trim().max(30).nullable(),
  travelMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable(),
  durationDays: z.number().int().positive().max(365).nullable(),
  adults: z.number().int().min(1).max(50).nullable(),
  children: z.number().int().min(0).max(50).nullable(),
  budget: z.number().nonnegative().max(100_000_000).nullable(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable(),
  hotelPreference: z.string().trim().max(120).nullable(),
  specialRequirements: z.array(z.string().trim().min(1).max(500)).max(20),
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
  missingFields: z.array(z.string().trim().min(1).max(80)).max(20),
  uncertainFields: z.array(z.string().trim().min(1).max(80)).max(20),
});

export const recommendationResponseSchema = z.object({
  recommendations: z.array(z.object({
    packageId: z.string().min(1),
    matchingReasons: z.array(z.string().trim().min(1).max(300)).max(5),
    uncertainFit: z.array(z.string().trim().min(1).max(300)).max(5),
  })).max(3),
  noGoodMatchReason: z.string().trim().max(500).nullable(),
});

export const aiReplySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  uncertaintyNotes: z.array(z.string().trim().min(1).max(300)).max(10),
});

export type ExtractedRequirements = z.infer<typeof extractedRequirementsSchema>;
export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;
export type AiReply = z.infer<typeof aiReplySchema>;
