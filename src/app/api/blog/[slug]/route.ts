import { connection } from "next/server";
import { errorResponse, notFoundResponse } from "@/server/services/api-response";
import { getPublishedBlogPostBySlug } from "@/server/services/blog-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connection();
    const { slug } = await params;
    const post = await getPublishedBlogPostBySlug(slug);

    if (!post || post.status !== "PUBLISHED" || !post.publishedVersion) {
      return notFoundResponse();
    }

    return Response.json({ data: post });
  } catch (error) {
    return errorResponse(error);
  }
}
