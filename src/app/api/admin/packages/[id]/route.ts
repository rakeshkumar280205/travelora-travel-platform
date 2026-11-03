import { packageUpdateSchema } from "@/lib/validation/package-schemas";
import { connection } from "next/server";
import {
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { presentPackage } from "@/server/services/package-presenter";
import { editPackage } from "@/server/services/package-service";
import { hasStaffRole } from "@/server/services/authorization";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connection();
    if (!(await hasStaffRole(["ADMIN", "EDITOR"]))) {
      return unauthorizedResponse();
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
