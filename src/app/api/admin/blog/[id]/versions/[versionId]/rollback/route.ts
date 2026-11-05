import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import { rollbackBlogPostVersion } from "@/server/services/blog-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    if (!["ADMIN", "EDITOR"].includes(session.user.role)) {
      return forbiddenResponse();
    }

    const { id, versionId } = await params;
    const version = await rollbackBlogPostVersion(id, versionId, session.user.id);

    return Response.json({ data: version });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "BLOG_POST_NOT_FOUND" ||
        error.message === "VERSION_NOT_FOUND")
    ) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
