import "server-only";

import { ZodError } from "zod";

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    );
  }

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 }
  );
}

export function unauthorizedResponse() {
  return Response.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication is required.",
      },
    },
    { status: 401 }
  );
}

export function notFoundResponse() {
  return Response.json(
    {
      error: {
        code: "NOT_FOUND",
        message: "The requested resource was not found.",
      },
    },
    { status: 404 }
  );
}
