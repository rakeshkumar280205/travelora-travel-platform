import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createQuote,
  findQuoteById,
  findQuoteByPublicToken,
  generateUniqueQuoteNumber,
  listQuotes,
  updateQuote,
} = vi.hoisted(() => ({
  createQuote: vi.fn(),
  findQuoteById: vi.fn(),
  findQuoteByPublicToken: vi.fn(),
  generateUniqueQuoteNumber: vi.fn(),
  listQuotes: vi.fn(),
  updateQuote: vi.fn(),
}));

const { prisma } = vi.hoisted(() => ({
  prisma: {
    enquiry: { findUnique: vi.fn() },
    package: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma }));
vi.mock("@/server/repositories/quote-repository", () => ({
  createQuote,
  deleteQuote: vi.fn(),
  findQuoteById,
  findQuoteByPublicToken,
  generateUniqueQuoteNumber,
  listQuotes,
  updateQuote,
}));

import {
  addQuoteForStaff,
  getPublicQuote,
  getQuoteDetailForStaff,
  manageQuotePublicLink,
} from "@/server/services/quote-service";

const samplePackage = {
  id: "pkg-1",
  slug: "kerala-highlands",
  title: "Highlands of Munnar",
  destination: "Munnar",
  durationDays: 4,
  category: "Hill Station",
  hotelCategory: "Tea Bungalow",
  description: "Walks among tea plantations and mist-covered ridges.",
  seasonalPrices: [
    {
      id: "sp-1",
      seasonName: "Winter Season",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-12-31"),
      amount: 40000,
      currency: "INR",
      pricingBasis: "Per person; indicative package price; GST treatment to be confirmed",
    },
  ],
  itineraryDays: [
    { dayNumber: 1, title: "Munnar Arrival", description: "Scenic transfer." },
    { dayNumber: 2, title: "Tea Estate Walk", description: "Private estate visit." },
  ],
};

const sampleQuote = {
  id: "quote-1",
  quoteNumber: "TRV-QT-2026-0001",
  status: "GENERATED" as const,
  customerName: "Rohan Varma",
  customerEmail: "rohan@example.com",
  customerPhone: "+91 98888 77777",
  startDate: new Date("2026-11-15"),
  endDate: new Date("2026-11-18"),
  durationDays: 4,
  adults: 2,
  children: 1,
  basePriceAmount: 40000,
  currency: "INR",
  pricingBasis: "Per person",
  calculatedTotal: 80000,
  notes: "Private SUV transfer included.",
  publicToken: "test-secure-token-123",
  isTokenRevoked: false,
  tokenExpiresAt: new Date(Date.now() + 86400000 * 30),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdById: "consultant-1",
  packageId: "pkg-1",
  package: samplePackage,
  seasonalPriceId: "sp-1",
  seasonalPrice: samplePackage.seasonalPrices[0],
  enquiryId: "enq-1",
  enquiry: {
    id: "enq-1",
    customerName: "Rohan Varma",
    email: "rohan@example.com",
    destination: "Munnar",
    assignedConsultantId: "consultant-1",
    status: "IN_PROGRESS",
  },
  createdBy: {
    id: "consultant-1",
    name: "Consultant One",
    email: "consultant1@travelora.com",
    role: "CONSULTANT" as const,
  },
  snapshot: {
    quoteNumber: "TRV-QT-2026-0001",
    package: {
      title: "Highlands of Munnar",
      destination: "Munnar",
      durationDays: 4,
    },
    calculation: {
      adultRate: "40000",
      adultsCount: 2,
      adultSubtotal: "80000",
      childrenCount: 1,
      childrenRate: null,
      indicativeTotal: "80000",
    },
    disclaimers: {
      gstStatus: "Subject to confirmation",
      childPricingPolicy: "Unpriced in indicative quote",
    },
  },
};

describe("quote service operations & authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Role & Assignment Authorization", () => {
    it("allows ADMIN to create a quote for any enquiry", async () => {
      prisma.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-unassigned",
        assignedConsultantId: "another-consultant",
      });
      prisma.package.findUnique.mockResolvedValueOnce(samplePackage);
      prisma.user.findUnique.mockResolvedValueOnce({
        name: "Admin User",
        email: "admin@travelora.com",
      });
      generateUniqueQuoteNumber.mockResolvedValueOnce("TRV-QT-2026-0002");
      createQuote.mockResolvedValueOnce({ id: "new-quote-id" });

      const created = await addQuoteForStaff(
        {
          enquiryId: "enq-unassigned",
          packageId: "pkg-1",
          customerName: "Neha Patel",
          customerEmail: "neha@example.com",
          startDate: "2026-11-20",
          durationDays: 4,
          adults: 2,
          children: 0,
        },
        "admin-1",
        "ADMIN"
      );

      expect(created).toBeDefined();
      expect(createQuote).toHaveBeenCalledWith(
        expect.objectContaining({
          quoteNumber: "TRV-QT-2026-0002",
          customerName: "Neha Patel",
          calculatedTotal: expect.anything(),
        })
      );
    });

    it("allows CONSULTANT to create quote for their assigned enquiry", async () => {
      prisma.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-1",
        assignedConsultantId: "consultant-1",
      });
      prisma.package.findUnique.mockResolvedValueOnce(samplePackage);
      prisma.user.findUnique.mockResolvedValueOnce({
        name: "Consultant One",
        email: "consultant1@travelora.com",
      });
      generateUniqueQuoteNumber.mockResolvedValueOnce("TRV-QT-2026-0003");
      createQuote.mockResolvedValueOnce({ id: "quote-created-by-consultant" });

      const created = await addQuoteForStaff(
        {
          enquiryId: "enq-1",
          packageId: "pkg-1",
          customerName: "Rohan Varma",
          customerEmail: "rohan@example.com",
          startDate: "2026-11-15",
          durationDays: 4,
          adults: 2,
          children: 1,
        },
        "consultant-1",
        "CONSULTANT"
      );

      expect(created).toBeDefined();
    });

    it("rejects CONSULTANT with FORBIDDEN when attempting to quote for an unassigned enquiry", async () => {
      prisma.enquiry.findUnique.mockResolvedValueOnce({
        id: "enq-other",
        assignedConsultantId: "different-consultant-99",
      });

      await expect(
        addQuoteForStaff(
          {
            enquiryId: "enq-other",
            packageId: "pkg-1",
            customerName: "Unauthorized Target",
            customerEmail: "target@example.com",
            startDate: "2026-11-15",
            durationDays: 4,
            adults: 2,
            children: 0,
          },
          "consultant-1",
          "CONSULTANT"
        )
      ).rejects.toThrow("FORBIDDEN");

      expect(createQuote).not.toHaveBeenCalled();
    });

    it("rejects CONSULTANT with FORBIDDEN when viewing quote of unassigned enquiry created by someone else", async () => {
      findQuoteById.mockResolvedValueOnce({
        ...sampleQuote,
        createdById: "other-consultant",
        enquiry: {
          id: "enq-unassigned",
          assignedConsultantId: "other-consultant",
        },
      });

      await expect(
        getQuoteDetailForStaff("quote-1", "consultant-1", "CONSULTANT")
      ).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("Snapshot Immutability", () => {
    it("freezes package itinerary, seasonal pricing, and calculation in snapshot", async () => {
      prisma.package.findUnique.mockResolvedValueOnce(samplePackage);
      prisma.user.findUnique.mockResolvedValueOnce({
        name: "Consultant One",
        email: "c1@example.com",
      });
      generateUniqueQuoteNumber.mockResolvedValueOnce("TRV-QT-2026-9999");
      createQuote.mockImplementationOnce((data) => data);

      const created = await addQuoteForStaff(
        {
          packageId: "pkg-1",
          customerName: "Vikram Seth",
          customerEmail: "vikram@example.com",
          startDate: "2026-11-10",
          durationDays: 4,
          adults: 3,
          children: 2,
        },
        "consultant-1",
        "CONSULTANT"
      );

      const snapshot = created.snapshot as {
        quoteNumber: string;
        package: { title: string };
        seasonalPrice: { seasonName: string };
        calculation: {
          adultSubtotal: string;
          childrenCount: number;
          childrenRate: string | null;
        };
      };
      expect(snapshot).toBeDefined();
      expect(snapshot.quoteNumber).toBe("TRV-QT-2026-9999");
      expect(snapshot.package.title).toBe("Highlands of Munnar");
      expect(snapshot.seasonalPrice.seasonName).toBe("Winter Season");
      expect(snapshot.calculation.adultSubtotal).toBe("120000"); // 3 adults * 40,000
      expect(snapshot.calculation.childrenCount).toBe(2);
      expect(snapshot.calculation.childrenRate).toBeNull(); // explicitly unpriced
    });
  });

  describe("Public Link Generation and Revocation", () => {
    it("generates an unguessable public token", async () => {
      findQuoteById.mockResolvedValueOnce(sampleQuote);
      updateQuote.mockImplementationOnce((id, data) => ({
        ...sampleQuote,
        publicToken: data.publicToken,
        isTokenRevoked: data.isTokenRevoked,
      }));

      const result = await manageQuotePublicLink("quote-1", "create", "consultant-1", "CONSULTANT");

      expect(result.publicToken).toBeDefined();
      expect(result.publicToken!.length).toBeGreaterThan(20);
      expect(result.isTokenRevoked).toBe(false);
    });

    it("sanitizes staff-only internal notes for public client preview", async () => {
      findQuoteByPublicToken.mockResolvedValueOnce(sampleQuote);

      const publicView = await getPublicQuote("test-secure-token-123");

      expect(publicView.quoteNumber).toBe("TRV-QT-2026-0001");
      expect(publicView.customerName).toBe("Rohan Varma");
      expect(publicView.package.title).toBe("Highlands of Munnar");
      // Must not expose internal notes or staff database IDs
      expect("notes" in publicView).toBe(false);
      expect("createdById" in publicView).toBe(false);
    });

    it("revokes access immediately when link is revoked", async () => {
      findQuoteById.mockResolvedValueOnce(sampleQuote);
      updateQuote.mockResolvedValueOnce({
        ...sampleQuote,
        isTokenRevoked: true,
      });

      await manageQuotePublicLink("quote-1", "revoke", "consultant-1", "CONSULTANT");
      expect(updateQuote).toHaveBeenCalledWith("quote-1", { isTokenRevoked: true });

      // Looking up a revoked token returns null or isTokenRevoked: true
      findQuoteByPublicToken.mockResolvedValueOnce({
        ...sampleQuote,
        isTokenRevoked: true,
      });

      await expect(getPublicQuote("test-secure-token-123")).rejects.toThrow("QUOTE_NOT_FOUND");
    });
  });
});
