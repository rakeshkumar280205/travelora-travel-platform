import {
  errorResponse,
} from "@/server/services/api-response";
import { connection } from "next/server";
import { presentPackages } from "@/server/services/package-presenter";
import { getPublishedPackages } from "@/server/services/package-service";

export async function GET() {
  try {
    await connection();
    const packages = await getPublishedPackages();
    return Response.json({ data: presentPackages(packages) });
  } catch (error) {
    return errorResponse(error);
  }
}
