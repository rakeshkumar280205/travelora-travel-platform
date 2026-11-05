import { connection } from "next/server";

import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  rateLimitResponse,
  rateLimitUnavailableResponse,
  serviceUnavailableResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import {
  isGeminiServiceError,
  recommendPackagesForEnquiry,
} from "@/server/services/enquiry-admin-service";
import { getEnquiryStaffAccess } from "@/server/services/enquiry-access";
import {
  enforceRateLimit,
  getAiRateLimitKey,
  RateLimitUnavailableError,
} from "@/server/services/rate-limit";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const rateLimit = await enforceRateLimit(
      "ai",
      getAiRateLimitKey(access.session.user.id),
    );
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
    const { id } = await context.params;
    return Response.json({
      data: await recommendPackagesForEnquiry(id, access.session.user.id, access.role),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ENQUIRY_NOT_FOUND") return notFoundResponse();
    if (error instanceof Error && error.message === "FORBIDDEN") return forbiddenResponse();
    if (isGeminiServiceError(error)) {
      return serviceUnavailableResponse("AI recommendations are temporarily unavailable. Try again later.");
    }
    if (error instanceof RateLimitUnavailableError) return rateLimitUnavailableResponse();
    return errorResponse(error);
  }
}
