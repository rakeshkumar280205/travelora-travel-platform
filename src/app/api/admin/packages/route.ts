import { packageCreateSchema } from "@/lib/validation/package-schemas";
import { connection } from "next/server";
import {
  errorResponse,
  forbiddenResponse,
  unauthorizedResponse,
} from "@/server/services/api-response";
import { presentPackages } from "@/server/services/package-presenter";
import {
  addPackage,
  getAdminPackages,
} from "@/server/services/package-service";
import { getStaffSession, hasStaffRole } from "@/server/services/authorization";

export async function GET() {
  try {
    await connection();
    if (!(await hasStaffRole(["ADMIN", "EDITOR", "CONSULTANT"]))) {
      return unauthorizedResponse();
    }
    return Response.json({ data: presentPackages(await getAdminPackages()) });
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
    const input = packageCreateSchema.parse(await request.json());
    const packageRecord = await addPackage(input);
    return Response.json(
      { data: presentPackages([packageRecord])[0] },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
