import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import {
  addQuoteForStaff,
  getQuotesForStaff,
} from "@/server/services/quote-service";
import {
  PricingIntegrityError,
  quoteCreateSchema,
  quoteListQuerySchema,
} from "@/lib/validation/quote-schemas";

export async function GET(request: Request) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const query = quoteListQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "ALL",
      packageId: searchParams.get("packageId") || undefined,
      enquiryId: searchParams.get("enquiryId") || undefined,
    });

    const quotes = await getQuotesForStaff(
      session.user.id,
      session.user.role,
      query
    );

    return Response.json({ data: quotes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    // Only ADMIN, CONSULTANT, or EDITOR can create quotes
    if (!["ADMIN", "CONSULTANT", "EDITOR"].includes(session.user.role)) {
      return forbiddenResponse();
    }

    const json = await request.json();
    const input = quoteCreateSchema.parse(json);

    const quote = await addQuoteForStaff(
      input,
      session.user.id,
      session.user.role
    );

    return Response.json({ data: quote }, { status: 201 });
  } catch (error) {
    if (error instanceof PricingIntegrityError) {
      return Response.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: 422 }
      );
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return forbiddenResponse();
    }
    if (error instanceof Error && error.message === "ENQUIRY_NOT_FOUND") {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Associated enquiry was not found." } },
        { status: 404 }
      );
    }
    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Selected package was not found." } },
        { status: 404 }
      );
    }
    return errorResponse(error);
  }
}
