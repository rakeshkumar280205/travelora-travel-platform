import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession, hasStaffRole } from "@/server/services/authorization";
import {
  editBlogPost,
  getAdminBlogPostById,
  removeBlogPost,
} from "@/server/services/blog-service";
import { blogPostUpdateSchema } from "@/lib/validation/blog-schemas";

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
    const post = await getAdminBlogPostById(id);
    return Response.json({ data: post });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOG_POST_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
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
    const json = await request.json();
    const input = blogPostUpdateSchema.parse(json);
    const updated = await editBlogPost(id, input);

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOG_POST_NOT_FOUND") {
      return notFoundResponse();
    }
    if (error instanceof Error && error.message === "SLUG_ALREADY_EXISTS") {
      return Response.json(
        {
          error: {
            code: "CONFLICT",
            message: "A post with this slug already exists.",
          },
        },
        { status: 409 }
      );
    }
    return errorResponse(error);
  }
}

export async function DELETE(
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
    await removeBlogPost(id);

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOG_POST_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
