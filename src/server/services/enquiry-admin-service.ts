import "server-only";

import type { EnquiryStatus, Prisma } from "@prisma/client";

import {
  addEnquiryNote,
  findConsultant,
  findEnquiryById,
  listConsultants,
  listEnquiries,
  saveEnquiryReply,
  updateEnquiry,
} from "@/server/repositories/enquiry-repository";
import type { AdminEnquiryListQuery } from "@/lib/validation/admin-enquiry-schemas";
import {
  aiReplySchema,
  extractedRequirementsSchema,
  recommendationResponseSchema,
} from "@/lib/validation/ai-schemas";
import {
  generateStructuredJson,
  isGeminiServiceError,
} from "@/server/ai/gemini-service";
import { listPublishedPackages } from "@/server/repositories/package-repository";

const nullableString = { type: "STRING", nullable: true };
const nullableInteger = { type: "INTEGER", nullable: true };
const nullableNumber = { type: "NUMBER", nullable: true };
const confidenceFields = {
  type: "OBJECT",
  properties: {
    destination: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    travelStartDate: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    travelMonth: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    durationDays: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    adults: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    children: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    budget: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    currency: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    hotelPreference: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
    specialRequirements: { type: "STRING", enum: ["high", "medium", "low", "unknown"] },
  },
  required: [
    "destination",
    "travelStartDate",
    "travelMonth",
    "durationDays",
    "adults",
    "children",
    "budget",
    "currency",
    "hotelPreference",
    "specialRequirements",
  ],
};

const transitions: Record<EnquiryStatus, EnquiryStatus[]> = {
  NEW: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["WAITING_FOR_CUSTOMER", "RESPONDED", "CONVERTED", "CLOSED"],
  WAITING_FOR_CUSTOMER: ["IN_PROGRESS", "RESPONDED", "CONVERTED", "CLOSED"],
  RESPONDED: ["IN_PROGRESS", "CONVERTED", "CLOSED"],
  CONVERTED: ["CLOSED"],
  CLOSED: ["IN_PROGRESS"],
};

export async function getEnquiryList(query: AdminEnquiryListQuery, assignedOnlyTo?: string) {
  return listEnquiries({
    ...query,
    search: query.search || undefined,
    assignedOnlyTo,
  });
}

export async function getEnquiryDetail(id: string) {
  return findEnquiryById(id);
}

export async function getEnquiryConsultants() {
  return listConsultants();
}

export async function updateEnquiryForStaff(input: {
  id: string;
  actorId: string;
  actorRole: "ADMIN" | "CONSULTANT";
  status?: EnquiryStatus;
  assignedConsultantId?: string | null;
  destination?: string;
  travelMonth?: string | null;
  durationDays?: number | null;
  adults?: number;
  children?: number | null;
  budget?: number | null;
  currency?: string | null;
}) {
  const enquiry = await findEnquiryById(input.id);
  if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");
  if (input.actorRole === "CONSULTANT" && enquiry.assignedConsultantId !== input.actorId) {
    throw new Error("FORBIDDEN");
  }
  if (input.actorRole === "CONSULTANT" && input.assignedConsultantId !== undefined) {
    throw new Error("FORBIDDEN");
  }
  if (input.status && input.status !== enquiry.status) {
    const allowed = transitions[enquiry.status as EnquiryStatus];
    if (!allowed.includes(input.status)) throw new Error("INVALID_STATUS_TRANSITION");
  }
  if (input.assignedConsultantId !== undefined && input.assignedConsultantId !== null) {
    const consultant = await findConsultant(input.assignedConsultantId);
    if (!consultant) throw new Error("INVALID_CONSULTANT");
  }

  const activity: Prisma.EnquiryActivityCreateWithoutEnquiryInput | undefined =
    input.status && input.status !== enquiry.status
      ? {
          actor: { connect: { id: input.actorId } },
          type: "STATUS_CHANGED",
          metadata: { from: enquiry.status, to: input.status },
        }
      : input.assignedConsultantId !== undefined &&
          input.assignedConsultantId !== enquiry.assignedConsultantId
        ? {
            actor: { connect: { id: input.actorId } },
            type: "ASSIGNED",
            metadata: {
              from: enquiry.assignedConsultantId,
              to: input.assignedConsultantId,
            },
          }
        : undefined;
  const requirementChanged =
    input.destination !== undefined ||
    input.travelMonth !== undefined ||
    input.durationDays !== undefined ||
    input.adults !== undefined ||
    input.children !== undefined ||
    input.budget !== undefined ||
    input.currency !== undefined;

  return updateEnquiry(
    input.id,
    {
      ...(input.status ? { status: input.status } : {}),
      ...(input.assignedConsultantId !== undefined
        ? {
            assignedConsultant: input.assignedConsultantId
              ? { connect: { id: input.assignedConsultantId } }
              : { disconnect: true },
          }
        : {}),
      ...(input.destination !== undefined ? { destination: input.destination } : {}),
      ...(input.travelMonth !== undefined ? { travelMonth: input.travelMonth } : {}),
      ...(input.durationDays !== undefined ? { durationDays: input.durationDays } : {}),
      ...(input.adults !== undefined ? { adults: input.adults } : {}),
      ...(input.children !== undefined ? { children: input.children } : {}),
      ...(input.budget !== undefined ? { budget: input.budget } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
    },
    requirementChanged
      ? {
          actor: { connect: { id: input.actorId } },
          type: "STATUS_CHANGED",
          metadata: { kind: "REQUIREMENTS_CORRECTED" },
        }
      : activity,
  );
}

function assertAiAccess(enquiry: Awaited<ReturnType<typeof findEnquiryById>>, actorId: string, actorRole: "ADMIN" | "CONSULTANT") {
  if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");
  if (actorRole === "CONSULTANT" && enquiry.assignedConsultantId !== actorId) {
    throw new Error("FORBIDDEN");
  }
}

export async function extractEnquiryRequirements(
  id: string,
  actorId: string,
  actorRole: "ADMIN" | "CONSULTANT",
) {
  const enquiry = await findEnquiryById(id);
  assertAiAccess(enquiry, actorId, actorRole);

  const contextDetails = [
    enquiry!.destination ? `Selected destination: ${enquiry!.destination}` : null,
    enquiry!.travelMonth ? `Selected travel month: ${enquiry!.travelMonth}` : null,
    enquiry!.startDate ? `Selected start date: ${enquiry!.startDate.toISOString().slice(0, 10)}` : null,
    enquiry!.durationDays ? `Selected duration: ${enquiry!.durationDays} days` : null,
    enquiry!.adults ? `Adults: ${enquiry!.adults}` : null,
    enquiry!.children !== null && enquiry!.children !== undefined ? `Children: ${enquiry!.children}` : null,
    enquiry!.budget ? `Budget: ${enquiry!.currency ?? ""} ${enquiry!.budget}` : null,
  ].filter(Boolean).join(", ");

  const result = await generateStructuredJson(
    `Extract travel requirements from this customer enquiry into structured JSON.
${contextDetails ? `Enquiry submission context: ${contextDetails}\n` : ""}Customer message: ${enquiry!.message}

Rules:
1. Return every required field. Use null for unknown nullable values, including travelStartDate, travelMonth, durationDays, children, budget, currency, and hotelPreference.
2. Never invent missing travel details, children's ages, pricing, availability, or an exact travel date.
3. Convert a named month to YYYY-MM only when the travel year is explicitly known from the message or trusted context. If the year is not known, return travelMonth as null and include "travelMonth" in uncertainFields.
4. For an uncertain duration range such as 5 to 6 nights, do not invent or fabricate an exact duration; return durationDays as null (or an estimated integer) and record the duration range (e.g., "5 to 6 nights") in uncertainFields; never return a text string or range in durationDays.
5. If the budget is explicitly denominated in Indian rupees, return currency as INR. Otherwise return a three-letter uppercase currency code only when supported, or null.
6. Every confidence property is required and must be high, medium, low, or unknown. Preserve uncertainty in confidence, missingFields, and uncertainFields.`,
    {
      type: "OBJECT",
      properties: {
        destination: nullableString,
        travelStartDate: nullableString,
        travelMonth: nullableString,
        durationDays: nullableInteger,
        adults: nullableInteger,
        children: nullableInteger,
        budget: nullableNumber,
        currency: nullableString,
        hotelPreference: nullableString,
        specialRequirements: { type: "ARRAY", items: { type: "STRING" } },
        confidence: confidenceFields,
        missingFields: { type: "ARRAY", items: { type: "STRING" } },
        uncertainFields: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: [
        "destination",
        "travelStartDate",
        "travelMonth",
        "durationDays",
        "adults",
        "children",
        "budget",
        "currency",
        "hotelPreference",
        "specialRequirements",
        "confidence",
        "missingFields",
        "uncertainFields",
      ],
    },
    (value) => extractedRequirementsSchema.parse(value),
  );
  return { ...result, source: "AI_SUGGESTION" as const };
}

export async function recommendPackagesForEnquiry(
  id: string,
  actorId: string,
  actorRole: "ADMIN" | "CONSULTANT",
) {
  const enquiry = await findEnquiryById(id);
  assertAiAccess(enquiry, actorId, actorRole);
  const packages = await listPublishedPackages();

  if (packages.length === 0) {
    return {
      recommendations: [],
      noGoodMatchReason: "No published packages are currently available to recommend.",
    };
  }

  const result = await generateStructuredJson(
    `Select up to three matching package IDs from this published package list. Do not invent IDs, prices, availability, inclusions, or GST claims. Explain fit and uncertainty. Enquiry: ${JSON.stringify({
      destination: enquiry!.destination,
      travelMonth: enquiry!.travelMonth,
      durationDays: enquiry!.durationDays,
      adults: enquiry!.adults,
      children: enquiry!.children,
      message: enquiry!.message,
    })}. Published packages: ${JSON.stringify(packages.map((item) => ({
      id: item.id,
      title: item.title,
      destination: item.destination,
      durationDays: item.durationDays,
      hotelCategory: item.hotelCategory,
    })))}.`,
    {
      type: "OBJECT",
      properties: {
        recommendations: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              packageId: { type: "STRING" },
              matchingReasons: { type: "ARRAY", items: { type: "STRING" } },
              uncertainFit: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["packageId", "matchingReasons", "uncertainFit"],
          },
        },
        noGoodMatchReason: nullableString,
      },
      required: ["recommendations", "noGoodMatchReason"],
    },
    (value) => recommendationResponseSchema.parse(value),
  );
  const publishedById = new Map(packages.map((item) => [item.id, item]));
  return {
    recommendations: result.recommendations
      .map((item) => {
        const packageRecord = publishedById.get(item.packageId);
        if (!packageRecord) return null;
        return {
          ...item,
          package: {
            id: packageRecord.id,
            title: packageRecord.title,
            slug: packageRecord.slug,
            destination: packageRecord.destination,
            durationDays: packageRecord.durationDays,
            hotelCategory: packageRecord.hotelCategory,
            seasonalPrices: packageRecord.seasonalPrices.filter((price) => Number(price.amount) > 0),
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 3),
    noGoodMatchReason: result.noGoodMatchReason,
  };
}

export async function createAiReplyDraft(
  id: string,
  actorId: string,
  actorRole: "ADMIN" | "CONSULTANT",
) {
  const enquiry = await findEnquiryById(id);
  assertAiAccess(enquiry, actorId, actorRole);
  const published = await listPublishedPackages();
  const relevantPackage = enquiry!.package
    ? published.find((item) => item.id === enquiry!.package!.id)
    : undefined;
  const result = await generateStructuredJson(
    `Write a concise professional reply draft for a travel consultant. It is an unsent draft. Do not promise availability or booking, invent discounts, inclusions, child pricing, or GST treatment. Mention uncertainty notes when requirements are incomplete. Use only this published package information if present: ${JSON.stringify(relevantPackage ? {
      title: relevantPackage.title,
      destination: relevantPackage.destination,
      durationDays: relevantPackage.durationDays,
      hotelCategory: relevantPackage.hotelCategory,
      seasonalPrices: (relevantPackage.seasonalPrices ?? []).filter((price) => Number(price.amount) > 0),
    } : null)}. Enquiry: ${JSON.stringify({
      destination: enquiry!.destination,
      travelMonth: enquiry!.travelMonth,
      durationDays: enquiry!.durationDays,
      adults: enquiry!.adults,
      children: enquiry!.children,
      budget: enquiry!.budget ? String(enquiry!.budget) : null,
      currency: enquiry!.currency,
      message: enquiry!.message,
    })}.`,
    {
      type: "OBJECT",
      properties: {
        body: { type: "STRING" },
        uncertaintyNotes: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["body", "uncertaintyNotes"],
    },
    (value) => aiReplySchema.parse(value),
  );
  const saved = await saveEnquiryReply(id, actorId, result.body);
  return { ...saved, uncertaintyNotes: result.uncertaintyNotes, unsent: true };
}

export { isGeminiServiceError };

export async function addNoteForStaff(
  id: string,
  actorId: string,
  body: string,
  actorRole: "ADMIN" | "CONSULTANT",
) {
  const enquiry = await findEnquiryById(id);
  if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");
  if (actorRole === "CONSULTANT" && enquiry.assignedConsultantId !== actorId) {
    throw new Error("FORBIDDEN");
  }
  return addEnquiryNote(id, actorId, body);
}

export async function saveReplyForStaff(
  id: string,
  actorId: string,
  body: string,
  actorRole: "ADMIN" | "CONSULTANT",
) {
  const enquiry = await findEnquiryById(id);
  if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");
  if (actorRole === "CONSULTANT" && enquiry.assignedConsultantId !== actorId) {
    throw new Error("FORBIDDEN");
  }
  return saveEnquiryReply(id, actorId, body);
}
