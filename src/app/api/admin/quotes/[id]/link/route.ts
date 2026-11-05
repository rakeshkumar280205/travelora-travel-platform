import { connection } from "next/server";
import { z } from "zod";
import {
  badRequestResponse,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import { manageQuotePublicLink } from "@/server/services/quote-service";

const linkActionSchema = z.object({
  action: z.enum(["create", "revoke"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const json = await request.json();
    const parsed = linkActionSchema.safeParse(json);
    if (!parsed.success) {
      return badRequestResponse("Invalid action. Must be 'create' or 'revoke'.");
    }

    const updated = await manageQuotePublicLink(
      id,
      parsed.data.action,
      session.user.id,
      session.user.role
    );

    return Response.json({
      data: {
        publicToken: updated.publicToken,
        isTokenRevoked: updated.isTokenRevoked,
        tokenExpiresAt: updated.tokenExpiresAt,
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
