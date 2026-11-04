import { connection } from "next/server";

import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  serviceUnavailableResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import {
  extractEnquiryRequirements,
  isGeminiServiceError,
} from "@/server/services/enquiry-admin-service";
import { getEnquiryStaffAccess } from "@/server/services/enquiry-access";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const { id } = await context.params;
    return Response.json({
      data: await extractEnquiryRequirements(id, access.session.user.id, access.role),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ENQUIRY_NOT_FOUND") return notFoundResponse();
    if (error instanceof Error && error.message === "FORBIDDEN") return forbiddenResponse();
    if (isGeminiServiceError(error)) {
      return serviceUnavailableResponse("AI suggestions are temporarily unavailable. Review the enquiry manually or try again.");
    }
    return errorResponse(error);
  }
}
