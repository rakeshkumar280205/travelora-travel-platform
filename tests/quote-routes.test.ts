import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection } = vi.hoisted(() => ({ connection: vi.fn() }));
const {
  addQuoteForStaff,
  getPublicQuote,
  getQuoteDetailForStaff,
  getQuotePdfForPublic,
  getQuotePdfForStaff,
  getQuotesForStaff,
  getStaffSession,
} = vi.hoisted(() => ({
  addQuoteForStaff: vi.fn(),
  getPublicQuote: vi.fn(),
  getQuoteDetailForStaff: vi.fn(),
  getQuotePdfForPublic: vi.fn(),
  getQuotePdfForStaff: vi.fn(),
  getQuotesForStaff: vi.fn(),
  getStaffSession: vi.fn(),
}));

vi.mock("next/server", () => ({ connection }));
vi.mock("@/server/services/authorization", () => ({
  getStaffSession,
}));
vi.mock("@/server/services/quote-service", () => ({
  addQuoteForStaff,
  getPublicQuote,
  getQuoteDetailForStaff,
  getQuotePdfForPublic,
  getQuotePdfForStaff,
  getQuotesForStaff,
}));

import { GET as adminQuotesGet, POST as adminQuotesPost } from "@/app/api/admin/quotes/route";
import { GET as adminQuoteDetailGet } from "@/app/api/admin/quotes/[id]/route";
import { GET as adminQuotePdfGet } from "@/app/api/admin/quotes/[id]/pdf/route";
import { GET as publicQuoteGet } from "@/app/api/quotes/preview/[token]/route";
import { GET as publicQuotePdfGet } from "@/app/api/quotes/preview/[token]/pdf/route";
import { PricingIntegrityError } from "@/lib/validation/quote-schemas";

const validQuoteInput = {
  packageId: "pkg-1",
  customerName: "Sneha Nair",
  customerEmail: "sneha@example.com",
  startDate: "2026-11-20",
  durationDays: 5,
  adults: 2,
  children: 0,
};

describe("quote API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Admin quotation routes", () => {
    it("returns 401 for admin quotes GET if unauthenticated", async () => {
      getStaffSession.mockResolvedValueOnce(null);
      const response = await adminQuotesGet(new Request("http://localhost/api/admin/quotes"));
      expect(response.status).toBe(401);
    });

    it("returns 200 with quote list for authenticated staff", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      });
      getQuotesForStaff.mockResolvedValueOnce([
        { id: "q-1", quoteNumber: "TRV-QT-2026-0001" },
      ]);

      const response = await adminQuotesGet(new Request("http://localhost/api/admin/quotes"));
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data).toHaveLength(1);
    });

    it("returns 422 when travel date cannot be matched to seasonal pricing (Price Integrity)", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "consultant-1", role: "CONSULTANT" },
      });
      addQuoteForStaff.mockRejectedValueOnce(
        new PricingIntegrityError(
          "No seasonal pricing is configured for 2026-07-15.",
          "UNMATCHED_SEASONAL_DATE"
        )
      );

      const response = await adminQuotesPost(
        new Request("http://localhost/api/admin/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validQuoteInput),
        })
      );

      expect(response.status).toBe(422);
      const json = await response.json();
      expect(json.error.code).toBe("UNMATCHED_SEASONAL_DATE");
    });

    it("returns 201 on successful quote generation", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "consultant-1", role: "CONSULTANT" },
      });
      addQuoteForStaff.mockResolvedValueOnce({
        id: "new-quote-1",
        quoteNumber: "TRV-QT-2026-0005",
      });

      const response = await adminQuotesPost(
        new Request("http://localhost/api/admin/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validQuoteInput),
        })
      );

      expect(response.status).toBe(201);
      const json = await response.json();
      expect(json.data.quoteNumber).toBe("TRV-QT-2026-0005");
    });

    it("returns quote detail for authenticated staff", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      });
      getQuoteDetailForStaff.mockResolvedValueOnce({
        id: "q-1",
        quoteNumber: "TRV-QT-2026-0001",
        customerName: "Sneha Nair",
      });

      const response = await adminQuoteDetailGet(
        new Request("http://localhost/api/admin/quotes/q-1"),
        { params: Promise.resolve({ id: "q-1" }) }
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.quoteNumber).toBe("TRV-QT-2026-0001");
    });

    it("serves PDF with application/pdf Content-Type for staff", async () => {
      getStaffSession.mockResolvedValueOnce({
        user: { id: "admin-1", role: "ADMIN" },
      });
      getQuoteDetailForStaff.mockResolvedValueOnce({
        id: "q-1",
        quoteNumber: "TRV-QT-2026-0001",
      });
      const dummyPdf = Buffer.from("%PDF-1.4\n%%EOF");
      getQuotePdfForStaff.mockResolvedValueOnce(dummyPdf);

      const response = await adminQuotePdfGet(
        new Request("http://localhost/api/admin/quotes/q-1/pdf"),
        { params: Promise.resolve({ id: "q-1" }) }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
      expect(response.headers.get("Content-Disposition")).toContain(
        "Travelora-Quote-TRV-QT-2026-0001.pdf"
      );
    });
  });

  describe("Public guest preview routes", () => {
    it("returns 200 with sanitized public quote data", async () => {
      getPublicQuote.mockResolvedValueOnce({
        quoteNumber: "TRV-QT-2026-0001",
        customerName: "Sneha Nair",
        package: { title: "Backwaters" },
      });

      const response = await publicQuoteGet(
        new Request("http://localhost/api/quotes/preview/valid-token"),
        { params: Promise.resolve({ token: "valid-token" }) }
      );

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.quoteNumber).toBe("TRV-QT-2026-0001");
    });

    it("returns 404 when public token is revoked or expired", async () => {
      getPublicQuote.mockRejectedValueOnce(new Error("QUOTE_NOT_FOUND"));

      const response = await publicQuoteGet(
        new Request("http://localhost/api/quotes/preview/revoked-token"),
        { params: Promise.resolve({ token: "revoked-token" }) }
      );

      expect(response.status).toBe(404);
    });

    it("serves public PDF download with valid headers", async () => {
      getPublicQuote.mockResolvedValueOnce({
        quoteNumber: "TRV-QT-2026-0001",
      });
      const dummyPdf = Buffer.from("%PDF-1.4\n%%EOF");
      getQuotePdfForPublic.mockResolvedValueOnce(dummyPdf);

      const response = await publicQuotePdfGet(
        new Request("http://localhost/api/quotes/preview/valid-token/pdf"),
        { params: Promise.resolve({ token: "valid-token" }) }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/pdf");
    });
  });
});
