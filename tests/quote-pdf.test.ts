import { describe, expect, it } from "vitest";
import { generateQuotePdfBuffer, type PdfQuoteData } from "@/server/services/quote-pdf-service";

const samplePdfData: PdfQuoteData = {
  quoteNumber: "TRV-QT-2026-8899",
  generatedDate: "2026-11-05",
  customerName: "Priya Nambiar",
  customerEmail: "priya.nambiar@example.com",
  customerPhone: "+91 94470 12345",
  packageTitle: "Backwaters & Spice Hills of Kerala",
  destination: "Kerala",
  durationDays: 6,
  category: "Slow Luxury",
  hotelCategory: "Heritage & Sanctuary",
  startDate: "2026-12-10",
  endDate: "2026-12-15",
  seasonName: "Winter Peak Season",
  pricingBasis: "Per person; indicative package price; GST treatment to be confirmed",
  adultsCount: 2,
  childrenCount: 1,
  basePriceAmount: "65000",
  currency: "INR",
  adultSubtotal: "130000",
  calculatedTotal: "130000",
  itineraryDays: [
    { dayNumber: 1, title: "Cochin Arrival & Heritage Walk", description: "Colonial Fort Kochi exploration." },
    { dayNumber: 2, title: "Thekkady Spice Trails", description: "Private cardamom plantation walking trail." },
    { dayNumber: 3, title: "Kumarakom Lake Sanctuary", description: "Private boat safari." },
  ],
  consultantName: "Kavita Pillai",
  consultantEmail: "kavita@travelora.com",
  disclaimers: {
    gstStatus: "GST treatment is subject to confirmation upon final booking.",
    childPricingPolicy: "Child travellers remain unpriced in indicative quote.",
    pricingBasisPolicy: "Published price basis: Per person.",
    validityPolicy: "Indicative quote subject to lodge availability.",
    assumptions: ["Adults multiplied by published seasonal price."],
    exclusions: ["GST and gratuities."],
  },
};

describe("quote server-side PDF generator", () => {
  it("generates a valid, parseable PDF 1.4 binary buffer", () => {
    const buffer = generateQuotePdfBuffer(samplePdfData);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);

    const pdfString = buffer.toString("utf8");

    // Standard PDF 1.4 header
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);

    // Standard PDF trailer and EOF
    expect(pdfString.trim().endsWith("%%EOF")).toBe(true);

    // Cross reference table
    expect(pdfString).toContain("xref");
    expect(pdfString).toContain("trailer");
    expect(pdfString).toContain("/Root 1 0 R");

    // Required PDF objects
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("/Type /Page");
    expect(pdfString).toContain("/Type /Font");
    expect(pdfString).toContain("/BaseFont /Helvetica");
    expect(pdfString).toContain("/BaseFont /Helvetica-Bold");
  });

  it("embeds mandatory branding, quote metadata, and guest info", () => {
    const buffer = generateQuotePdfBuffer(samplePdfData);
    const pdfString = buffer.toString("utf8");

    expect(pdfString).toContain("TRAVELORA");
    expect(pdfString).toContain("JOURNEYS BEYOND ORDINARY");
    expect(pdfString).toContain("TRV-QT-2026-8899");
    expect(pdfString).toContain("Priya Nambiar");
    expect(pdfString).toContain("priya.nambiar@example.com");
    expect(pdfString).toContain("INR 130000");
    expect(pdfString).toContain("Winter Peak Season");
  });

  it("embeds GST and child pricing disclaimers in the document stream", () => {
    const buffer = generateQuotePdfBuffer(samplePdfData);
    const pdfString = buffer.toString("utf8");

    expect(pdfString).toContain("GST treatment is subject to confirmation");
    expect(pdfString).toContain("Child travellers remain unpriced");
    expect(pdfString).toContain("Kavita Pillai");
  });
});
