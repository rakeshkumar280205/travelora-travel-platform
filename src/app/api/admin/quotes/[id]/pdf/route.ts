import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import {
  getQuoteDetailForStaff,
  getQuotePdfForStaff,
} from "@/server/services/quote-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const quote = await getQuoteDetailForStaff(
      id,
      session.user.id,
      session.user.role
    );
    const pdfBuffer = await getQuotePdfForStaff(
      id,
      session.user.id,
      session.user.role
    );

    const safeFilename = `Travelora-Quote-${quote.quoteNumber}.pdf`;

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
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    if (error instanceof Error && error.message === "QUOTE_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
