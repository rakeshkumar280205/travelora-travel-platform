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

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  ) {
    return Response.json(
      {
        error: {
          code: "CONFLICT",
          message: "A record with the same unique value already exists.",
        },
      },
      { status: 409 },
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

export function forbiddenResponse() {
  return Response.json(
    {
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      },
    },
    { status: 403 },
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

export function badRequestResponse(message: string) {
  return Response.json(
    {
      error: {
        code: "BAD_REQUEST",
        message,
      },
    },
    { status: 400 },
  );
}

export function serviceUnavailableResponse(message: string) {
  return Response.json(
    { error: { code: "SERVICE_UNAVAILABLE", message } },
    { status: 503 },
  );
}
