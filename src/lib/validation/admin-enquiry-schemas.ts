import { z } from "zod";

export const enquiryStatusSchema = z.enum([
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESPONDED",
  "CONVERTED",
  "CLOSED",
]);

export const enquiryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(120).optional(),
  status: enquiryStatusSchema.optional(),
  packageId: z.string().trim().min(1).optional(),
  assignedConsultantId: z.string().trim().min(1).optional(),
});

export const enquiryUpdateSchema = z.object({
  status: enquiryStatusSchema.optional(),
  assignedConsultantId: z.string().trim().min(1).nullable().optional(),
  destination: z.string().trim().min(2).max(120).optional(),
  travelMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).nullable().optional(),
  durationDays: z.number().int().positive().max(365).nullable().optional(),
  adults: z.number().int().min(1).max(50).optional(),
  children: z.number().int().min(0).max(50).nullable().optional(),
  budget: z.number().nonnegative().max(100_000_000).nullable().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).nullable().optional(),
}).refine(
  (value) => Object.keys(value).length > 0,
  "At least one enquiry field must be provided.",
);

export const enquiryNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const enquiryReplySchema = z.object({
  body: z.string().trim().min(1).max(8000),
});

export type AdminEnquiryListQuery = z.infer<typeof enquiryListQuerySchema>;
