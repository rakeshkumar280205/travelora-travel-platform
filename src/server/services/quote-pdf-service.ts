import "server-only";

export type PdfQuoteData = {
  quoteNumber: string;
  generatedDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  packageTitle: string;
  destination: string;
  durationDays: number;
  category: string;
  hotelCategory: string;
  startDate?: string | null;
  endDate?: string | null;
  seasonName: string;
  pricingBasis: string;
  adultsCount: number;
  childrenCount: number;
  basePriceAmount: number | string;
  currency: string;
  adultSubtotal: number | string;
  calculatedTotal: number | string;
  itineraryDays?: Array<{
    dayNumber: number;
    title: string;
    description: string;
  }>;
  consultantName?: string | null;
  consultantEmail?: string | null;
  disclaimers: {
    gstStatus: string;
    childPricingPolicy: string;
    pricingBasisPolicy: string;
    validityPolicy: string;
    assumptions: string[];
    exclusions: string[];
  };
};

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " "); // ASCII printable only for Helvetica
}

/**
 * Builds a compliant PDF 1.4 binary buffer server-side.
 * Uses standard Type 1 fonts (Helvetica, Helvetica-Bold, Helvetica-Oblique)
 * without requiring any external native binaries or third-party paid services.
 */
export function generateQuotePdfBuffer(data: PdfQuoteData): Buffer {
  const streamLines: string[] = [];

  // Helper for adding stream ops
  const op = (str: string) => streamLines.push(str);

  // Colors:
  // Forest Green: rgb(27, 59, 43) -> 0.106, 0.231, 0.169
  // Gold: rgb(197, 168, 128) -> 0.773, 0.659, 0.502
  // Deep Green: rgb(15, 34, 25) -> 0.059, 0.133, 0.098
  // Charcoal: rgb(40, 40, 40) -> 0.157, 0.157, 0.157
  // Light Grey: rgb(240, 238, 233) -> 0.941, 0.933, 0.914

  // Page Dimensions: A4 = 595.28 x 841.89
  const width = 595.28;
  const height = 841.89;

  // 1. Header background (Forest Green top banner)
  op("0.106 0.231 0.169 rg"); // Forest green fill
  op(`0 740 ${width} 101.89 re f`);

  // Gold accent line under header
  op("0.773 0.659 0.502 rg"); // Gold fill
  op(`0 736 ${width} 4 re f`);

  // TRAVELORA Title
  op("BT");
  op("/F2 24 Tf"); // Helvetica-Bold
  op("1 1 1 rg"); // White
  op("50 790 Td");
  op(`(${escapePdfText("TRAVELORA")}) Tj`);
  op("ET");

  // Tagline
  op("BT");
  op("/F1 8 Tf"); // Helvetica
  op("0.773 0.659 0.502 rg"); // Gold
  op("50 776 Td");
  op(`(${escapePdfText("JOURNEYS BEYOND ORDINARY  *  PRIVATE TRAVEL ATELIER")}) Tj`);
  op("ET");

  // Right-aligned header info
  op("BT");
  op("/F2 11 Tf");
  op("0.773 0.659 0.502 rg");
  op("360 802 Td");
  op(`(${escapePdfText("OFFICIAL TRAVEL QUOTATION")}) Tj`);
  op("ET");

  op("BT");
  op("/F1 9 Tf");
  op("1 1 1 rg");
  op("360 788 Td");
  op(`(${escapePdfText(`Ref: ${data.quoteNumber}`)}) Tj`);
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.85 0.85 0.85 rg");
  op("360 774 Td");
  op(`(${escapePdfText(`Issued: ${data.generatedDate}`)}) Tj`);
  op("ET");

  // 2. Client & Journey Details (2-Column Info Grid)
  let y = 705;

  // Section Header: Guest & Expedition Overview
  op("0.941 0.933 0.914 rg"); // Light background bar
  op(`45 ${y - 4} 505 20 re f`);
  op("0.106 0.231 0.169 RG"); // Border
  op("0.5 w");
  op(`45 ${y - 4} 505 20 re S`);

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op("55 709 Td");
  op(`(${escapePdfText("1. GUEST AND EXPEDITION OVERVIEW")}) Tj`);
  op("ET");

  y -= 24;

  // Left Column: Guest Details
  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("Guest Name:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`130 ${y} Td`);
  op(`(${escapePdfText(data.customerName)}) Tj`);
  op("ET");

  // Right Column: Journey Details
  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`310 ${y} Td`);
  op(`(${escapePdfText("Journey:")}) Tj`);
  op("ET");
  op("BT");
  op("/F2 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`380 ${y} Td`);
  op(`(${escapePdfText(data.packageTitle.slice(0, 32))}) Tj`);
  op("ET");

  y -= 16;

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("Email:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`130 ${y} Td`);
  op(`(${escapePdfText(data.customerEmail)}) Tj`);
  op("ET");

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`310 ${y} Td`);
  op(`(${escapePdfText("Destination:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`380 ${y} Td`);
  op(`(${escapePdfText(`${data.destination} (${data.durationDays} Days)`)}) Tj`);
  op("ET");

  y -= 16;

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("Phone:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`130 ${y} Td`);
  op(`(${escapePdfText(data.customerPhone || "Not specified")}) Tj`);
  op("ET");

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`310 ${y} Td`);
  op(`(${escapePdfText("Season Tier:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`380 ${y} Td`);
  op(`(${escapePdfText(data.seasonName)}) Tj`);
  op("ET");

  y -= 16;

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("Travellers:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`130 ${y} Td`);
  op(
    `(${escapePdfText(
      `${data.adultsCount} Adult(s)${data.childrenCount > 0 ? `, ${data.childrenCount} Child(ren)` : ""}`
    )}) Tj`
  );
  op("ET");

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`310 ${y} Td`);
  op(`(${escapePdfText("Travel Window:")}) Tj`);
  op("ET");
  op("BT");
  op("/F1 9 Tf");
  op("0.2 0.2 0.2 rg");
  op(`380 ${y} Td`);
  op(
    `(${escapePdfText(
      data.startDate
        ? `${data.startDate.slice(0, 10)}${data.endDate ? ` to ${data.endDate.slice(0, 10)}` : ""}`
        : "Flexible"
    )}) Tj`
  );
  op("ET");

  // 3. Indicative Price Breakdown Table
  y -= 30;

  op("0.941 0.933 0.914 rg");
  op(`45 ${y - 4} 505 20 re f`);
  op("0.106 0.231 0.169 RG");
  op(`45 ${y - 4} 505 20 re S`);

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("2. INDICATIVE PRICING BREAKDOWN")}) Tj`);
  op("ET");

  y -= 22;

  // Table Column Headers
  op("0.106 0.231 0.169 rg");
  op(`45 ${y - 4} 505 18 re f`);

  op("BT");
  op("/F2 8 Tf");
  op("1 1 1 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("Component / Service Description")}) Tj`);
  op("210 0 Td");
  op(`(${escapePdfText("Pricing Basis")}) Tj`);
  op("120 0 Td");
  op(`(${escapePdfText("Rate")}) Tj`);
  op("70 0 Td");
  op(`(${escapePdfText("Indicative Total")}) Tj`);
  op("ET");

  y -= 20;

  // Row 1: Adults
  op("BT");
  op("/F2 8 Tf");
  op("0.2 0.2 0.2 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText(`Adult Package Rate (${data.adultsCount} Guest${data.adultsCount > 1 ? "s" : ""})`)}) Tj`);
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.3 0.3 0.3 rg");
  op(`265 ${y} Td`);
  op(`(${escapePdfText(data.pricingBasis.slice(0, 24))}) Tj`);
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.2 0.2 0.2 rg");
  op(`385 ${y} Td`);
  op(`(${escapePdfText(`${data.currency} ${data.basePriceAmount}`)}) Tj`);
  op("ET");

  op("BT");
  op("/F2 8 Tf");
  op("0.106 0.231 0.169 rg");
  op(`455 ${y} Td`);
  op(`(${escapePdfText(`${data.currency} ${data.adultSubtotal}`)}) Tj`);
  op("ET");

  // Divider line
  op("0.8 0.8 0.8 RG");
  op(`45 ${y - 6} m 550 ${y - 6} l S`);

  y -= 20;

  // Row 2: Children (if any or unpriced policy)
  op("BT");
  op("/F2 8 Tf");
  op("0.3 0.3 0.3 rg");
  op(`55 ${y} Td`);
  op(
    `(${escapePdfText(
      data.childrenCount > 0
        ? `Child Travellers (${data.childrenCount} Child${data.childrenCount > 1 ? "ren" : ""})`
        : "Child Travellers"
    )}) Tj`
  );
  op("ET");

  op("BT");
  op("/F3 8 Tf"); // Italic
  op("0.4 0.4 0.4 rg");
  op(`265 ${y} Td`);
  op(
    `(${escapePdfText(
      data.childrenCount > 0
        ? "Unpriced (subject to room share)"
        : "None (0 children)"
    )}) Tj`
  );
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.4 0.4 0.4 rg");
  op(`385 ${y} Td`);
  op(`(${escapePdfText("Unpriced")}) Tj`);
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.4 0.4 0.4 rg");
  op(`455 ${y} Td`);
  op(`(${escapePdfText("--")}) Tj`);
  op("ET");

  // Divider line
  op("0.8 0.8 0.8 RG");
  op(`45 ${y - 6} m 550 ${y - 6} l S`);

  y -= 22;

  // Row 3: Total row
  op("0.941 0.933 0.914 rg");
  op(`45 ${y - 4} 505 20 re f`);
  op("0.106 0.231 0.169 RG");
  op(`45 ${y - 4} 505 20 re S`);

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("INDICATIVE TOTAL (EXCL. UNCONFIRMED GST):")}) Tj`);
  op("ET");

  op("BT");
  op("/F2 10 Tf");
  op("0.106 0.231 0.169 rg");
  op(`445 ${y} Td`);
  op(`(${escapePdfText(`${data.currency} ${data.calculatedTotal}`)}) Tj`);
  op("ET");

  // 4. Itinerary Highlights (brief summary)
  y -= 30;

  op("0.941 0.933 0.914 rg");
  op(`45 ${y - 4} 505 18 re f`);
  op("0.106 0.231 0.169 RG");
  op(`45 ${y - 4} 505 18 re S`);

  op("BT");
  op("/F2 9 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y} Td`);
  op(`(${escapePdfText("3. ITINERARY SCHEDULE SUMMARY")}) Tj`);
  op("ET");

  y -= 18;

  if (data.itineraryDays && data.itineraryDays.length > 0) {
    const daysToShow = data.itineraryDays.slice(0, 5);
    for (const day of daysToShow) {
      op("BT");
      op("/F2 8 Tf");
      op("0.106 0.231 0.169 rg");
      op(`55 ${y} Td`);
      op(`(${escapePdfText(`Day ${day.dayNumber}:`)}) Tj`);
      op("ET");

      op("BT");
      op("/F1 8 Tf");
      op("0.2 0.2 0.2 rg");
      op(`100 ${y} Td`);
      op(`(${escapePdfText(day.title.slice(0, 75))}) Tj`);
      op("ET");

      y -= 14;
    }
    if (data.itineraryDays.length > 5) {
      op("BT");
      op("/F3 8 Tf");
      op("0.4 0.4 0.4 rg");
      op(`100 ${y} Td`);
      op(`(${escapePdfText(`... and ${data.itineraryDays.length - 5} additional curated days.`)} ) Tj`);
      op("ET");
      y -= 14;
    }
  } else {
    op("BT");
    op("/F1 8 Tf");
    op("0.4 0.4 0.4 rg");
    op(`55 ${y} Td`);
    op(`(${escapePdfText("Bespoke daily routing configured per customer request.")}) Tj`);
    op("ET");
    y -= 14;
  }

  // 5. Governance, GST & Pricing Policies Notice Box
  y -= 14;

  op("0.976 0.969 0.949 rg"); // Warm ivory
  op(`45 ${y - 80} 505 84 re f`);
  op("0.773 0.659 0.502 RG"); // Gold border
  op("1 w");
  op(`45 ${y - 80} 505 84 re S`);

  op("BT");
  op("/F2 8 Tf");
  op("0.106 0.231 0.169 rg");
  op(`55 ${y - 2} Td`);
  op(`(${escapePdfText("IMPORTANT TERMS & PRICING POLICIES")}) Tj`);
  op("ET");

  const notes = [
    `* GST Status: ${data.disclaimers.gstStatus.slice(0, 95)}`,
    `* Child Policy: ${data.disclaimers.childPricingPolicy.slice(0, 95)}`,
    `* Price Basis: ${data.disclaimers.pricingBasisPolicy.slice(0, 95)}`,
    `* Booking Terms: Confirmation required upon formal booking request; subject to lodge availability.`,
  ];

  let noteY = y - 16;
  for (const note of notes) {
    op("BT");
    op("/F1 7.5 Tf");
    op("0.25 0.25 0.25 rg");
    op(`55 ${noteY} Td`);
    op(`(${escapePdfText(note)}) Tj`);
    op("ET");
    noteY -= 14;
  }

  // 6. Footer (Confidentiality & Studio Sign-off)
  op("0.106 0.231 0.169 rg");
  op(`0 0 ${width} 36 re f`);

  op("BT");
  op("/F1 8 Tf");
  op("1 1 1 rg");
  op("50 14 Td");
  op(`(${escapePdfText("TRAVELORA PRIVATE TRAVEL STUDIO  *  CONFIDENTIAL CLIENT QUOTATION")}) Tj`);
  op("ET");

  op("BT");
  op("/F1 8 Tf");
  op("0.773 0.659 0.502 rg");
  op("440 14 Td");
  op(`(${escapePdfText(`Consultant: ${data.consultantName || "Private Atelier"}`)}) Tj`);
  op("ET");

  const streamContent = streamLines.join("\n");
  const streamLength = Buffer.byteLength(streamContent, "utf8");

  // Construct PDF Objects
  const objects: string[] = [];

  // 1 0 obj: Catalog
  objects.push(`1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj`);

  // 2 0 obj: Pages
  objects.push(`2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj`);

  // 3 0 obj: Page
  objects.push(`3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${width} ${height}]
  /Contents 4 0 R
  /Resources <<
    /Font <<
      /F1 5 0 R
      /F2 6 0 R
      /F3 7 0 R
    >>
  >>
>>
endobj`);

  // 4 0 obj: Content Stream
  objects.push(`4 0 obj
<<
  /Length ${streamLength}
>>
stream
${streamContent}
endstream
endobj`);

  // 5 0 obj: Font Helvetica
  objects.push(`5 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica
>>
endobj`);

  // 6 0 obj: Font Helvetica-Bold
  objects.push(`6 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Bold
>>
endobj`);

  // 7 0 obj: Font Helvetica-Oblique
  objects.push(`7 0 obj
<<
  /Type /Font
  /Subtype /Type1
  /BaseFont /Helvetica-Oblique
>>
endobj`);

  // Assemble cross-reference table (xref)
  let offset = 0;
  const header = "%PDF-1.4\n";
  offset += Buffer.byteLength(header, "utf8");

  const xrefEntries = ["0000000000 65535 f \n"];

  const assembledObjects: string[] = [];
  for (const obj of objects) {
    const formattedOffset = String(offset).padStart(10, "0");
    xrefEntries.push(`${formattedOffset} 00000 n \n`);
    const objStr = `${obj}\n`;
    offset += Buffer.byteLength(objStr, "utf8");
    assembledObjects.push(objStr);
  }

  const startXref = offset;
  const xref = `xref
0 ${objects.length + 1}
${xrefEntries.join("")}`;

  const trailer = `trailer
<<
  /Size ${objects.length + 1}
  /Root 1 0 R
>>
startxref
${startXref}
%%EOF`;

  const fullPdf = header + assembledObjects.join("") + xref + trailer;
  return Buffer.from(fullPdf, "utf8");
}
