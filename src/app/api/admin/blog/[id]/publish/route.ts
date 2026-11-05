import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession } from "@/server/services/authorization";
import { publishBlogPostRecord } from "@/server/services/blog-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    if (!["ADMIN", "EDITOR"].includes(session.user.role)) {
      return forbiddenResponse();
    }

    const { id } = await params;
    const version = await publishBlogPostRecord(id, session.user.id);

    return Response.json({ data: version }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOG_POST_NOT_FOUND") {
      return notFoundResponse();
    }
    if (error instanceof Error && error.message === "POST_NOT_PUBLISHABLE") {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "All required blog fields must be complete before publishing.",
          },
        },
        { status: 400 }
      );
    }
    return errorResponse(error);
  }
}
