import { connection } from "next/server";

import { getStaffSession } from "@/server/services/authorization";
import { errorResponse, notFoundResponse, unauthorizedResponse } from "@/server/services/api-response";
import { getAdminPackages, getPackageVersionHistory } from "@/server/services/package-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connection();
    if (!(await getStaffSession())) return unauthorizedResponse();
    const { id } = await params;
    const exists = (await getAdminPackages()).some((item) => item.id === id);
    if (!exists) return notFoundResponse();
    return Response.json({ data: await getPackageVersionHistory(id) });
  } catch (error) {
    return errorResponse(error);
  }
}
