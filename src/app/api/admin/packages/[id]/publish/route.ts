import { connection } from "next/server";

import { getStaffSession } from "@/server/services/authorization";
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "@/server/services/api-response";
import { publishPackageRecord } from "@/server/services/package-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();
    if (!["ADMIN", "EDITOR"].includes(session.user.role)) return forbiddenResponse();
    const { id } = await params;
    const version = await publishPackageRecord(id, session.user.id);
    return Response.json({ data: version }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "PACKAGE_NOT_FOUND") {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
