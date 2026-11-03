import { notFoundResponse, errorResponse } from "@/server/services/api-response";
import { connection } from "next/server";
import { presentPackage } from "@/server/services/package-presenter";
import { getPublishedPackageBySlug } from "@/server/services/package-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connection();
    const { slug } = await params;
    const packageRecord = await getPublishedPackageBySlug(slug);
    if (!packageRecord) {
      return notFoundResponse();
    }
    return Response.json({ data: presentPackage(packageRecord) });
  } catch (error) {
    return errorResponse(error);
  }
}
