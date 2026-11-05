import { connection } from "next/server";
import { errorResponse } from "@/server/services/api-response";
import { getPublishedBlogPosts } from "@/server/services/blog-service";

export async function GET(request: Request) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const tag = searchParams.get("tag") || undefined;

    const posts = await getPublishedBlogPosts({ category, tag });

    return Response.json({ data: posts });
  } catch (error) {
    return errorResponse(error);
  }
}
