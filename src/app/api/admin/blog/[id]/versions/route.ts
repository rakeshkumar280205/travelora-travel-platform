import { connection } from "next/server";
import {
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { hasStaffRole } from "@/server/services/authorization";
import { getBlogPostVersionHistory } from "@/server/services/blog-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    if (!(await hasStaffRole(["ADMIN", "EDITOR", "CONSULTANT"]))) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const versions = await getBlogPostVersionHistory(id);
    return Response.json({ data: versions });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOG_POST_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
