import { connection } from "next/server";

import { enquiryReplySchema } from "@/lib/validation/admin-enquiry-schemas";
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "@/server/services/api-response";
import { saveReplyForStaff } from "@/server/services/enquiry-admin-service";
import { getEnquiryStaffAccess } from "@/server/services/enquiry-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const { id } = await context.params;
    const { body } = enquiryReplySchema.parse(await request.json());
    const reply = await saveReplyForStaff(
      id,
      access.session.user.id,
      body,
      access.role,
    );
    return Response.json({ data: reply }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ENQUIRY_NOT_FOUND") return notFoundResponse();
      if (error.message === "FORBIDDEN") return forbiddenResponse();
    }
    return errorResponse(error);
  }
}
