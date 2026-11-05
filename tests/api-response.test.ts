import { describe, expect, it } from "vitest";

import { errorResponse } from "@/server/services/api-response";

describe("API error responses", () => {
  it("returns a client error for malformed JSON instead of exposing an internal failure", async () => {
    const response = errorResponse(new SyntaxError("Unexpected token"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      error: {
        code: "BAD_REQUEST",
        message: "Request body must be valid JSON.",
      },
    });
  });
});
