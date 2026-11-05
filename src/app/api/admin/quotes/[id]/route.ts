import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import {
  editQuoteForStaff,
  getQuoteDetailForStaff,
} from "@/server/services/quote-service";
import {
  PricingIntegrityError,
  quoteUpdateSchema,
} from "@/lib/validation/quote-schemas";

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

    return Response.json({ data: quote });
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const json = await request.json();
    const input = quoteUpdateSchema.parse(json);

    const updated = await editQuoteForStaff(
      id,
      input,
      session.user.id,
      session.user.role
    );

    return Response.json({ data: updated });
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
    if (error instanceof Error && error.message === "QUOTE_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
