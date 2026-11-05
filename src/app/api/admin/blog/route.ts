import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { getStaffSession, hasStaffRole } from "@/server/services/authorization";
import {
  addBlogPost,
  getAdminBlogPosts,
} from "@/server/services/blog-service";
import { blogPostCreateSchema, blogPostListQuerySchema } from "@/lib/validation/blog-schemas";

export async function GET(request: Request) {
  try {
    await connection();
    if (!(await hasStaffRole(["ADMIN", "EDITOR", "CONSULTANT"]))) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const query = blogPostListQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") || "ALL",
      category: searchParams.get("category") || undefined,
      tag: searchParams.get("tag") || undefined,
    });

    const posts = await getAdminBlogPosts({
      search: query.search,
      status: query.status,
      category: query.category,
    });

    return Response.json({ data: posts });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();

    if (!["ADMIN", "EDITOR"].includes(session.user.role)) {
      return forbiddenResponse();
    }

    const json = await request.json();
    const input = blogPostCreateSchema.parse(json);
    const post = await addBlogPost(input, session.user.id);

    return Response.json({ data: post }, { status: 201 });
  } catch (error) {
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
