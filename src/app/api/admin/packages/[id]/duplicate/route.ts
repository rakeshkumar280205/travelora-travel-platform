import { connection } from "next/server";

import { presentPackage } from "@/server/services/package-presenter";
import { duplicatePackageRecord } from "@/server/services/package-service";
import { getStaffSession } from "@/server/services/authorization";
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "@/server/services/api-response";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();
    if (!["ADMIN", "EDITOR"].includes(session.user.role)) {
      return forbiddenResponse();
    }
    const { id } = await params;
    return Response.json(
      { data: presentPackage(await duplicatePackageRecord(id)) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && (error.name === "NotFoundError" || error.message === "PACKAGE_NOT_FOUND")) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
