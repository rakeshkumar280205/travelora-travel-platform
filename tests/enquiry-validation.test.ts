import { describe, expect, it } from "vitest";

import { publicEnquirySchema } from "@/lib/validation/enquiry-schemas";
import { enquiryListQuerySchema } from "@/lib/validation/admin-enquiry-schemas";

const validEnquiry = {
  customerName: "Asha Menon",
  email: "asha@example.test",
  phone: "+91 98765 43210",
  message: "We would like a relaxed Kerala itinerary.",
  destination: "Kerala",
  startDate: "2026-06-15",
  adults: "2",
  children: "1",
  budget: "75000",
  currency: "INR",
  website: "",
};

describe("public enquiry validation", () => {
  it("accepts valid input and coerces traveller values", () => {
    const result = publicEnquirySchema.parse(validEnquiry);
    expect(result.adults).toBe(2);
    expect(result.children).toBe(1);
    expect(result.budget).toBe(75000);
  });

  it("rejects invalid email, phone, counts, and oversized messages", () => {
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, email: "invalid" }).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, phone: "12" }).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, adults: "0" }).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, children: "-1" }).success).toBe(false);
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, message: "x".repeat(4001) }).success).toBe(false);
  });

  it("accepts package-free enquiries and rejects a non-empty honeypot", () => {
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, packageSlug: undefined }).success).toBe(true);
    expect(publicEnquirySchema.safeParse({ ...validEnquiry, website: "bot" }).success).toBe(false);
  });

  it("bounds admin list pagination and normalizes empty search values", () => {
    expect(enquiryListQuerySchema.parse({ page: "2", pageSize: "50", search: "  " }))
      .toMatchObject({ page: 2, pageSize: 50, search: "" });
    expect(enquiryListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(enquiryListQuerySchema.safeParse({ pageSize: "51" }).success).toBe(false);
  });
});
