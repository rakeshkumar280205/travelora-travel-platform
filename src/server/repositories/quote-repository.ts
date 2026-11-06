import "server-only";

import type { Prisma, QuoteStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";

const quoteInclude = {
  package: {
    select: {
      id: true,
      slug: true,
      title: true,
      destination: true,
      durationDays: true,
      category: true,
      hotelCategory: true,
      description: true,
      publishedVersionId: true,
      itineraryDays: {
        select: {
          id: true,
          dayNumber: true,
          title: true,
          description: true,
        },
        orderBy: { dayNumber: "asc" as const },
      },
      seasonalPrices: {
        select: {
          id: true,
          seasonName: true,
          startDate: true,
          endDate: true,
          amount: true,
          currency: true,
          pricingBasis: true,
        },
        orderBy: { startDate: "asc" as const },
      },
    },
  },
  enquiry: {
    select: {
      id: true,
      customerName: true,
      email: true,
      destination: true,
      assignedConsultantId: true,
      status: true,
    },
  },
  seasonalPrice: {
    select: {
      id: true,
      seasonName: true,
      startDate: true,
      endDate: true,
      amount: true,
      currency: true,
      pricingBasis: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
};

export async function listQuotes(query?: {
  search?: string;
  status?: QuoteStatus | "ALL";
  packageId?: string;
  enquiryId?: string;
  consultantId?: string; // If consultant role, only assigned enquiries or created by consultant
}) {
  const where: Prisma.QuoteWhereInput = {};

  if (query?.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query?.packageId) {
    where.packageId = query.packageId;
  }

  if (query?.enquiryId) {
    where.enquiryId = query.enquiryId;
  }

  if (query?.consultantId) {
    // Consultant can only see quotes they created or for enquiries assigned to them
    where.OR = [
      { createdById: query.consultantId },
      { enquiry: { assignedConsultantId: query.consultantId } },
    ];
  }

  if (query?.search && query.search.trim() !== "") {
    const term = query.search.trim();
    const searchConditions: Prisma.QuoteWhereInput[] = [
      { quoteNumber: { contains: term, mode: "insensitive" } },
      { customerName: { contains: term, mode: "insensitive" } },
      { customerEmail: { contains: term, mode: "insensitive" } },
      { package: { title: { contains: term, mode: "insensitive" } } },
      { package: { destination: { contains: term, mode: "insensitive" } } },
    ];

    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: searchConditions }];
      delete where.OR;
    } else {
      where.OR = searchConditions;
    }
  }

  return prisma.quote.findMany({
    where,
    include: quoteInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findQuoteById(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: quoteInclude,
  });
}

export async function findQuoteByNumber(quoteNumber: string) {
  return prisma.quote.findUnique({
    where: { quoteNumber },
    include: quoteInclude,
  });
}

export async function findQuoteByPublicToken(token: string) {
  return prisma.quote.findFirst({
    where: {
      publicToken: token,
      isTokenRevoked: false,
    },
    include: quoteInclude,
  });
}

export async function createQuote(data: Prisma.QuoteCreateInput) {
  return prisma.quote.create({
    data,
    include: quoteInclude,
  });
}

export async function updateQuote(id: string, data: Prisma.QuoteUpdateInput) {
  return prisma.quote.update({
    where: { id },
    data,
    include: quoteInclude,
  });
}

export async function deleteQuote(id: string) {
  return prisma.quote.delete({
    where: { id },
  });
}

export async function generateUniqueQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count();
  let candidate = `TRV-QT-${year}-${String(count + 1).padStart(4, "0")}`;

  let attempts = 0;
  while (attempts < 15) {
    const existing = await prisma.quote.findUnique({
      where: { quoteNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;

    const random = Math.floor(1000 + Math.random() * 9000);
    candidate = `TRV-QT-${year}-${String(count + attempts + 2).padStart(4, "0")}-${random}`;
    attempts += 1;
  }
  return `TRV-QT-${year}-${Date.now().toString().slice(-6)}`;
}
