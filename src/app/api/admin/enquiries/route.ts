import { connection } from "next/server";

import { enquiryListQuerySchema } from "@/lib/validation/admin-enquiry-schemas";
import { errorResponse, forbiddenResponse, unauthorizedResponse } from "@/server/services/api-response";
import { getEnquiryList } from "@/server/services/enquiry-admin-service";
import { getEnquiryStaffAccess } from "@/server/services/enquiry-access";

export async function GET(request: Request) {
  try {
    await connection();
    const access = await getEnquiryStaffAccess();
    if (!access.session) return unauthorizedResponse();
    if (access.role === "FORBIDDEN") return forbiddenResponse();
    const query = enquiryListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const result = await getEnquiryList(
      query,
      access.role === "CONSULTANT" ? access.session.user.id : undefined,
    );
    return Response.json({
      data: result.items,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
