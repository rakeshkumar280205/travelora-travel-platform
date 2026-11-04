import { connection } from "next/server";

import { getStaffSession } from "@/server/services/authorization";
import { errorResponse, forbiddenResponse, notFoundResponse, unauthorizedResponse } from "@/server/services/api-response";
import { rollbackPackageVersion } from "@/server/services/package-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    await connection();
    const session = await getStaffSession();
    if (!session) return unauthorizedResponse();
    if (!["ADMIN", "EDITOR"].includes(session.user.role)) return forbiddenResponse();
    const { id, versionId } = await params;
    const version = await rollbackPackageVersion(id, versionId, session.user.id);
    return Response.json({ data: version }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && ["VERSION_NOT_FOUND", "PACKAGE_NOT_FOUND"].includes(error.message)) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
