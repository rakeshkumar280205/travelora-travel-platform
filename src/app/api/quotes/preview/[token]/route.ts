import { connection } from "next/server";
import { errorResponse, notFoundResponse } from "@/server/services/api-response";
import { getPublicQuote } from "@/server/services/quote-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await connection();
    const { token } = await params;
    const publicQuote = await getPublicQuote(token);

    return Response.json({ data: publicQuote });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "QUOTE_NOT_FOUND" || error.message === "QUOTE_EXPIRED")
    ) {
      return notFoundResponse();
    }
    return errorResponse(error);
  }
}
