import { connection } from "next/server";

import { publicEnquirySchema } from "@/lib/validation/enquiry-schemas";
import {
  badRequestResponse,
  errorResponse,
  notFoundResponse,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/server/services/api-response";
import { createPublicEnquiry } from "@/server/services/enquiry-service";
import {
  enforceRateLimit,
  getPublicEnquiryRateLimitKey,
  RateLimitUnavailableError,
} from "@/server/services/rate-limit";

const ACKNOWLEDGEMENT =
  "Thank you for contacting Travelora! We've received your travel enquiry. Our team will review your requirements and get back to you.";

export async function POST(request: Request) {
  try {
    await connection();
    const rateLimit = await enforceRateLimit(
      "public-enquiry",
      getPublicEnquiryRateLimitKey(request),
    );
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds);
    const bodyText = await request.text();
    if (bodyText.length > 20_000) {
      return badRequestResponse("Request is too large.");
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return badRequestResponse("Request body must be valid JSON.");
    }

    const input = publicEnquirySchema.parse(body);
    if (input.website) {
      return badRequestResponse("Request validation failed.");
    }

    await createPublicEnquiry(input);
    return Response.json(
      { data: { message: ACKNOWLEDGEMENT } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return notFoundResponse();
    }
    if (error instanceof RateLimitUnavailableError) {
      return rateLimitUnavailableResponse();
    }
    return errorResponse(error);
  }
}
