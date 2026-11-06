import "server-only";

import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  calculateQuote,
  matchSeasonalPrice,
  quoteCreateSchema,
  quoteUpdateSchema,
  type QuoteCreateInput,
  type QuoteListQuery,
  type QuoteUpdateInput,
} from "@/lib/validation/quote-schemas";
import {
  createQuote,
  findQuoteById,
  findQuoteByPublicToken,
  generateUniqueQuoteNumber,
  listQuotes,
  updateQuote,
} from "@/server/repositories/quote-repository";
import { generateQuotePdfBuffer, type PdfQuoteData } from "@/server/services/quote-pdf-service";

type StaffRole = "ADMIN" | "EDITOR" | "CONSULTANT";

function assertStaffAccess(
  quote: NonNullable<Awaited<ReturnType<typeof findQuoteById>>>,
  actorId: string,
  actorRole: StaffRole
) {
  if (actorRole === "ADMIN") return;

  // Consultants are restricted to quotes they created or for enquiries assigned to them
  if (actorRole === "CONSULTANT") {
    const isCreator = quote.createdById === actorId;
    const isAssigned = quote.enquiry?.assignedConsultantId === actorId;
    if (!isCreator && !isAssigned) {
      throw new Error("FORBIDDEN");
    }
    return;
  }

  // Editors have viewing access
  if (actorRole === "EDITOR") return;

  throw new Error("FORBIDDEN");
}

async function assertEnquiryAssignment(
  enquiryId: string,
  actorId: string,
  actorRole: StaffRole
) {
  if (actorRole === "ADMIN") return;

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: enquiryId },
    select: { assignedConsultantId: true },
  });

  if (!enquiry) throw new Error("ENQUIRY_NOT_FOUND");

  if (actorRole === "CONSULTANT" && enquiry.assignedConsultantId !== actorId) {
    throw new Error("FORBIDDEN");
  }
}

export async function getQuotesForStaff(
  actorId: string,
  actorRole: StaffRole,
  query?: QuoteListQuery
) {
  return listQuotes({
    search: query?.search,
    status: query?.status,
    packageId: query?.packageId,
    enquiryId: query?.enquiryId,
    consultantId: actorRole === "CONSULTANT" ? actorId : undefined,
  });
}

export async function getQuoteDetailForStaff(
  id: string,
  actorId: string,
  actorRole: StaffRole
) {
  const quote = await findQuoteById(id);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  assertStaffAccess(quote, actorId, actorRole);
  return quote;
}

export async function addQuoteForStaff(
  input: QuoteCreateInput,
  actorId: string,
  actorRole: StaffRole
) {
  const validated = quoteCreateSchema.parse(input);

  if (validated.enquiryId) {
    await assertEnquiryAssignment(validated.enquiryId, actorId, actorRole);
  }

  // Retrieve published package with seasonal prices and itinerary
  const packageRecord = await prisma.package.findUnique({
    where: { id: validated.packageId },
    include: {
      seasonalPrices: { orderBy: { startDate: "asc" } },
      itineraryDays: { orderBy: { dayNumber: "asc" } },
    },
  });

  if (!packageRecord) {
    throw new Error("PACKAGE_NOT_FOUND");
  }

  // Sourced strictly from the database: match seasonal pricing
  const seasonMatch = matchSeasonalPrice(
    packageRecord.seasonalPrices.map((sp) => ({
      id: sp.id,
      seasonName: sp.seasonName,
      startDate: sp.startDate,
      endDate: sp.endDate,
      amount: String(sp.amount),
      currency: sp.currency,
      pricingBasis: sp.pricingBasis,
    })),
    validated.startDate,
    validated.seasonalPriceId
  );

  // Transparent calculation (zero AI invention)
  const calc = calculateQuote(
    validated.adults,
    validated.children ?? 0,
    seasonMatch
  );

  const quoteNumber = await generateUniqueQuoteNumber();

  // Calculate endDate based on startDate and durationDays
  let endDate: Date | null = null;
  if (validated.startDate) {
    const s = new Date(validated.startDate);
    if (!isNaN(s.getTime())) {
      endDate = new Date(s);
      endDate.setDate(endDate.getDate() + (validated.durationDays - 1));
    }
  }

  const creator = await prisma.user.findUnique({
    where: { id: actorId },
    select: { name: true, email: true },
  });

  // Freeze immutable snapshot of the quotation
  const snapshot = {
    quoteNumber,
    generatedAt: new Date().toISOString(),
    package: {
      id: packageRecord.id,
      slug: packageRecord.slug,
      title: packageRecord.title,
      destination: packageRecord.destination,
      durationDays: packageRecord.durationDays,
      category: packageRecord.category,
      hotelCategory: packageRecord.hotelCategory,
      description: packageRecord.description,
      itineraryDays: packageRecord.itineraryDays.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description,
      })),
    },
    seasonalPrice: {
      id: seasonMatch.id,
      seasonName: seasonMatch.seasonName,
      startDate: new Date(seasonMatch.startDate).toISOString(),
      endDate: new Date(seasonMatch.endDate).toISOString(),
      amount: String(seasonMatch.amount),
      currency: seasonMatch.currency,
      pricingBasis: seasonMatch.pricingBasis,
    },
    travellers: {
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      customerPhone: validated.customerPhone ?? null,
      adults: validated.adults,
      children: validated.children ?? 0,
      startDate: validated.startDate,
      endDate: endDate ? endDate.toISOString() : null,
    },
    calculation: {
      adultRate: String(calc.basePriceAmount),
      adultsCount: calc.adultsCount,
      adultSubtotal: String(calc.adultSubtotal),
      childrenCount: calc.childrenCount,
      childrenRate: null, // explicitly unpriced
      currency: calc.currency,
      pricingBasis: calc.pricingBasis,
      indicativeTotal: String(calc.calculatedTotal),
      charges: [],
    },
    disclaimers: calc.disclaimers,
    consultant: {
      name: creator?.name ?? "Travelora Private Atelier",
      email: creator?.email ?? null,
    },
  };

  // Generate a distinct public access token for every new quote
  const publicToken = crypto.randomBytes(24).toString("base64url");
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 30); // 30-day default validity

  const createData: Prisma.QuoteCreateInput = {
    quoteNumber,
    status: "GENERATED",
    customerName: validated.customerName,
    customerEmail: validated.customerEmail,
    customerPhone: validated.customerPhone ?? null,
    startDate: validated.startDate ? new Date(validated.startDate) : null,
    endDate,
    durationDays: validated.durationDays,
    adults: validated.adults,
    children: validated.children ?? 0,
    basePriceAmount: new Prisma.Decimal(calc.basePriceAmount),
    currency: calc.currency,
    pricingBasis: calc.pricingBasis,
    calculatedTotal: new Prisma.Decimal(calc.calculatedTotal),
    notes: validated.notes ?? null,
    snapshot: snapshot as unknown as Prisma.InputJsonValue,
    publicToken,
    tokenExpiresAt,
    isTokenRevoked: false,
    package: { connect: { id: packageRecord.id } },
    seasonalPrice: { connect: { id: seasonMatch.id } },
    createdBy: { connect: { id: actorId } },
    ...(validated.enquiryId ? { enquiry: { connect: { id: validated.enquiryId } } } : {}),
  };

  return createQuote(createData);
}

export async function editQuoteForStaff(
  id: string,
  input: QuoteUpdateInput,
  actorId: string,
  actorRole: StaffRole
) {
  const quote = await findQuoteById(id);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  assertStaffAccess(quote, actorId, actorRole);

  const validated = quoteUpdateSchema.parse(input);
  const updateData: Prisma.QuoteUpdateInput = {};

  if (validated.customerName !== undefined) updateData.customerName = validated.customerName;
  if (validated.customerEmail !== undefined) updateData.customerEmail = validated.customerEmail;
  if (validated.customerPhone !== undefined) updateData.customerPhone = validated.customerPhone;
  if (validated.notes !== undefined) updateData.notes = validated.notes;
  if (validated.status !== undefined) {
    updateData.status = validated.status;
    if (validated.status === "SENT") updateData.sentAt = new Date();
    if (validated.status === "ACCEPTED") updateData.acceptedAt = new Date();
    if (validated.status === "REJECTED") updateData.rejectedAt = new Date();
  }

  // If parameters affecting price changed (adults, children, date, season), re-calculate
  if (
    validated.adults !== undefined ||
    validated.children !== undefined ||
    validated.startDate !== undefined ||
    validated.seasonalPriceId !== undefined
  ) {
    const adults = validated.adults ?? quote.adults;
    const children = validated.children ?? quote.children;
    const startDateStr = validated.startDate ?? (quote.startDate ? quote.startDate.toISOString() : null);

    const packageRecord = await prisma.package.findUnique({
      where: { id: quote.packageId },
      include: {
        seasonalPrices: { orderBy: { startDate: "asc" } },
        itineraryDays: { orderBy: { dayNumber: "asc" } },
      },
    });

    if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");

    const seasonMatch = matchSeasonalPrice(
      packageRecord.seasonalPrices.map((sp) => ({
        id: sp.id,
        seasonName: sp.seasonName,
        startDate: sp.startDate,
        endDate: sp.endDate,
        amount: String(sp.amount),
        currency: sp.currency,
        pricingBasis: sp.pricingBasis,
      })),
      startDateStr,
      validated.seasonalPriceId ?? quote.seasonalPriceId
    );

    const calc = calculateQuote(adults, children, seasonMatch);

    let endDate: Date | null = null;
    const durDays = validated.durationDays ?? quote.durationDays;
    if (startDateStr) {
      const s = new Date(startDateStr);
      if (!isNaN(s.getTime())) {
        endDate = new Date(s);
        endDate.setDate(endDate.getDate() + (durDays - 1));
      }
    }

    updateData.adults = adults;
    updateData.children = children;
    if (startDateStr) updateData.startDate = new Date(startDateStr);
    updateData.endDate = endDate;
    updateData.basePriceAmount = new Prisma.Decimal(calc.basePriceAmount);
    updateData.currency = calc.currency;
    updateData.pricingBasis = calc.pricingBasis;
    updateData.calculatedTotal = new Prisma.Decimal(calc.calculatedTotal);
    updateData.seasonalPrice = { connect: { id: seasonMatch.id } };
    updateData.status = "GENERATED";
  }

  return updateQuote(id, updateData);
}

export async function manageQuotePublicLink(
  id: string,
  action: "create" | "revoke",
  actorId: string,
  actorRole: StaffRole
) {
  const quote = await findQuoteById(id);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  assertStaffAccess(quote, actorId, actorRole);

  if (action === "revoke") {
    return updateQuote(id, {
      isTokenRevoked: true,
    });
  }

  // Create unguessable cryptographically secure token
  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days link validity

  return updateQuote(id, {
    publicToken: token,
    tokenExpiresAt: expiresAt,
    isTokenRevoked: false,
  });
}

export async function getPublicQuote(token: string) {
  const quote = await findQuoteByPublicToken(token);
  if (!quote || quote.isTokenRevoked) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  if (quote.tokenExpiresAt && quote.tokenExpiresAt < new Date()) {
    throw new Error("QUOTE_EXPIRED");
  }

  // Sanitize internal details: no internal notes, no staff user IDs
  return {
    quoteNumber: quote.quoteNumber,
    customerName: quote.customerName,
    package: {
      title: quote.package.title,
      destination: quote.package.destination,
      durationDays: quote.package.durationDays,
      category: quote.package.category,
      hotelCategory: quote.package.hotelCategory,
      description: quote.package.description,
      itineraryDays: quote.package.itineraryDays,
    },
    startDate: quote.startDate?.toISOString() ?? null,
    endDate: quote.endDate?.toISOString() ?? null,
    adults: quote.adults,
    children: quote.children,
    pricing: {
      basePriceAmount: String(quote.basePriceAmount),
      currency: quote.currency,
      pricingBasis: quote.pricingBasis,
      calculatedTotal: String(quote.calculatedTotal),
      seasonName: quote.seasonalPrice?.seasonName ?? "Standard Season",
    },
    snapshot: quote.snapshot,
    status: quote.status,
    createdAt: quote.createdAt.toISOString(),
  };
}

export async function getQuotePdfForStaff(
  id: string,
  actorId: string,
  actorRole: StaffRole
): Promise<Buffer> {
  const quote = await findQuoteById(id);
  if (!quote) throw new Error("QUOTE_NOT_FOUND");
  assertStaffAccess(quote, actorId, actorRole);

  return buildPdfFromQuote(quote);
}

export async function getQuotePdfForPublic(token: string): Promise<Buffer> {
  const quote = await findQuoteByPublicToken(token);
  if (!quote || quote.isTokenRevoked) {
    throw new Error("QUOTE_NOT_FOUND");
  }

  return buildPdfFromQuote(quote);
}

function buildPdfFromQuote(quote: NonNullable<Awaited<ReturnType<typeof findQuoteById>>>): Buffer {
  const snapshot = quote.snapshot as Record<string, unknown> | null;
  const disclaimers = (snapshot?.disclaimers as PdfQuoteData["disclaimers"]) ?? {
    gstStatus: "Subject to confirmation; GST policy not supplied by supplier.",
    childPricingPolicy: "Child pricing is unpriced in this indicative quotation.",
    pricingBasisPolicy: quote.pricingBasis,
    validityPolicy: "Indicative quote subject to hotel availability.",
    assumptions: ["Adults multiplied by published seasonal price."],
    exclusions: ["GST and personal gratuities."],
  };

  const pdfData: PdfQuoteData = {
    quoteNumber: quote.quoteNumber,
    generatedDate: quote.createdAt.toISOString().slice(0, 10),
    customerName: quote.customerName,
    customerEmail: quote.customerEmail,
    customerPhone: quote.customerPhone,
    packageTitle: quote.package.title,
    destination: quote.package.destination,
    durationDays: quote.durationDays,
    category: quote.package.category,
    hotelCategory: quote.package.hotelCategory,
    startDate: quote.startDate?.toISOString() ?? null,
    endDate: quote.endDate?.toISOString() ?? null,
    seasonName: quote.seasonalPrice?.seasonName ?? "Seasonal Rate",
    pricingBasis: quote.pricingBasis,
    adultsCount: quote.adults,
    childrenCount: quote.children,
    basePriceAmount: String(quote.basePriceAmount),
    currency: quote.currency,
    adultSubtotal: String(quote.calculatedTotal),
    calculatedTotal: String(quote.calculatedTotal),
    itineraryDays: quote.package.itineraryDays,
    consultantName: quote.createdBy?.name ?? null,
    consultantEmail: quote.createdBy?.email ?? null,
    disclaimers,
  };

  return generateQuotePdfBuffer(pdfData);
}
