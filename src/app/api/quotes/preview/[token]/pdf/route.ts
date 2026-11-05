import { connection } from "next/server";
import { errorResponse, notFoundResponse } from "@/server/services/api-response";
import { getPublicQuote, getQuotePdfForPublic } from "@/server/services/quote-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connection();
    const { token } = await params;
    const publicQuote = await getPublicQuote(token);
    const pdfBuffer = await getQuotePdfForPublic(token);

    const safeFilename = `Travelora-Quote-${publicQuote.quoteNumber}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": String(pdfBuffer.length),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "QUOTE_NOT_FOUND" || error.message === "QUOTE_EXPIRED")
    ) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
