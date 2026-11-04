import { packageUpdateSchema } from "@/lib/validation/package-schemas";
import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { presentPackage } from "@/server/services/package-presenter";
import { editPackage } from "@/server/services/package-service";
import { getStaffSession } from "@/server/services/authorization";

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
    const input = packageUpdateSchema.parse(await request.json());
    const packageRecord = await editPackage(id, input);
    return Response.json({ data: presentPackage(packageRecord) });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
