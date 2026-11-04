import { connection } from "next/server";

import { enquiryUpdateSchema } from "@/lib/validation/admin-enquiry-schemas";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getEnquiryDetail, updateEnquiryForStaff } from "@/server/services/enquiry-admin-service";
import { getEnquiryStaffAccess } from "@/server/services/enquiry-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const { id } = await context.params;
    const enquiry = await getEnquiryDetail(id);
    if (!enquiry) return notFoundResponse();
    if (
      access.role === "CONSULTANT" &&
      enquiry.assignedConsultantId !== access.session.user.id
    ) {
      return forbiddenResponse();
    }
    return Response.json({ data: enquiry });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const { id } = await context.params;
    const input = enquiryUpdateSchema.parse(await request.json());
    const enquiry = await updateEnquiryForStaff({
      id,
      actorId: access.session.user.id,
      actorRole: access.role,
      ...input,
    });
    return Response.json({ data: enquiry });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ENQUIRY_NOT_FOUND") return notFoundResponse();
      if (["FORBIDDEN", "INVALID_CONSULTANT"].includes(error.message)) return forbiddenResponse();
      if (error.message === "INVALID_STATUS_TRANSITION") {
        return Response.json(
          { error: { code: "INVALID_STATUS_TRANSITION", message: "That status transition is not allowed." } },
          { status: 409 },
        );
      }
    }
    return errorResponse(error);
  }
}
