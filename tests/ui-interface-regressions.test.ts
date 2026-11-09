import { describe, expect, it } from "vitest";
import { enquiryListQuerySchema } from "@/lib/validation/admin-enquiry-schemas";
import fs from "node:fs";
import path from "node:path";

describe("UI interface regressions", () => {
  describe("enquiry filter query parsing and combinations", () => {
    it("handles multiple combined filters with automatic pagination default", () => {
      const parsed = enquiryListQuerySchema.parse({
        search: "Asha Menon",
        status: "NEW",
        packageId: "pkg-kerala-01",
        assignedConsultantId: "user-consultant-1",
      });

      expect(parsed).toEqual({
        page: 1, // Resets to page 1 when page param is omitted
        pageSize: 20,
        search: "Asha Menon",
        status: "NEW",
        packageId: "pkg-kerala-01",
        assignedConsultantId: "user-consultant-1",
      });
    });

    it("allows resetting filters by omitting query values", () => {
      const parsed = enquiryListQuerySchema.parse({
        page: undefined,
        search: undefined,
        status: undefined,
        packageId: undefined,
        assignedConsultantId: undefined,
      });

      expect(parsed).toEqual({
        page: 1,
        pageSize: 20,
        search: undefined,
        status: undefined,
        packageId: undefined,
        assignedConsultantId: undefined,
      });
    });

    it("preserves explicit pagination when provided", () => {
      const parsed = enquiryListQuerySchema.parse({
        page: "3",
        pageSize: "15",
        status: "IN_PROGRESS",
      });

      expect(parsed.page).toBe(3);
      expect(parsed.pageSize).toBe(15);
      expect(parsed.status).toBe("IN_PROGRESS");
    });
  });

  describe("destination showcase layout", () => {
    it("does not include Rameswaram in the public destination showcase", () => {
      const homePageSource = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/page.tsx"),
        "utf8"
      );

      // Verify Rameswaram is absent from destination array
      expect(homePageSource).not.toMatch(/name:\s*"Rameswaram"/);

      // Verify Kanyakumari is present in destinations
      expect(homePageSource).toMatch(/name:\s*"Kanyakumari"/);
    });
  });

  describe("quote creation button deduplication", () => {
    it("ensures duplicate Create quote button is removed from quote list filter bar", () => {
      const quoteListSource = fs.readFileSync(
        path.resolve(process.cwd(), "src/components/admin/quote-list.tsx"),
        "utf8"
      );

      // Verify no Link to /admin/quotes/new inside quote-list
      expect(quoteListSource).not.toContain('href="/admin/quotes/new"');
      expect(quoteListSource).not.toContain("Create quote");
    });

    it("verifies the primary Create quotation button remains in admin quotes page header", () => {
      const adminQuotesPageSource = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/admin/(protected)/quotes/page.tsx"),
        "utf8"
      );

      expect(adminQuotesPageSource).toContain('href="/admin/quotes/new"');
      expect(adminQuotesPageSource).toContain("Create quotation");
    });
  });

  describe("dashboard audit trail panel removal", () => {
    it("ensures Audit trail / Recent activity panel is removed from admin dashboard", () => {
      const dashboardSource = fs.readFileSync(
        path.resolve(process.cwd(), "src/app/admin/(protected)/page.tsx"),
        "utf8"
      );

      expect(dashboardSource).not.toContain("Audit trail");
      expect(dashboardSource).not.toContain("Recent activity");
      expect(dashboardSource).toContain("Recent packages");
      expect(dashboardSource).toContain("Dashboard statistics");
    });
  });
});
