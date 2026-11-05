import "server-only";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { getGeminiEnv } from "@/config/env";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 20_000;

export class GeminiServiceError extends Error {
  constructor(
    public readonly code:
      | "AI_UNAVAILABLE"
      | "AI_TIMEOUT"
      | "AI_EMPTY_RESPONSE"
      | "AI_MALFORMED_JSON"
      | "AI_SCHEMA_INVALID"
      | "AI_REQUEST_FAILED",
    public readonly safeDetails?: string,
  ) {
    super(code);
  }
}

function getClient() {
  const { GEMINI_API_KEY } = getGeminiEnv();
  if (!GEMINI_API_KEY) throw new GeminiServiceError("AI_UNAVAILABLE");
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

export async function generateStructuredJson<T>(
  prompt: string,
  schema: Record<string, unknown>,
  parse: (value: unknown) => T,
) {
  const { GEMINI_MODEL = DEFAULT_MODEL } = getGeminiEnv();
  const client = getClient();
  const request = client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.1,
    },
  });

  let response;
  try {
    response = await Promise.race([
      request,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new GeminiServiceError("AI_TIMEOUT")), REQUEST_TIMEOUT_MS),
      ),
    ]);
  } catch (error) {
    if (error instanceof GeminiServiceError) throw error;
    const rawMessage = error instanceof Error ? error.message : "Request failed";
    // Sanitize API keys or credentials before logging to avoid exposing secrets
    const safeError = rawMessage
      .replace(/key=[^&\s]+/gi, "key=[REDACTED]")
      .replace(/AIza[0-9A-Za-z-_]{35}/g, "[REDACTED]")
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [REDACTED]");
    console.error(`[GeminiService] Provider request failed: ${safeError}`);
    throw new GeminiServiceError("AI_REQUEST_FAILED", safeError);
  }

  let text = response.text?.trim();
  if (!text) throw new GeminiServiceError("AI_EMPTY_RESPONSE");

  // Strip markdown code fences if wrapped by the model (e.g. ```json ... ```)
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  if (!text) throw new GeminiServiceError("AI_EMPTY_RESPONSE");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    const errorMsg = parseError instanceof Error ? parseError.message : "Malformed JSON";
    console.error(`[GeminiService] JSON parse failed: ${errorMsg}`);
    throw new GeminiServiceError("AI_MALFORMED_JSON");
  }

  try {
    return parse(parsed);
  } catch (schemaError) {
    let diagnostic = "Schema validation failed";
    if (schemaError instanceof z.ZodError) {
      diagnostic = schemaError.issues
        .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
        .join("; ");
    } else if (schemaError instanceof Error) {
      diagnostic = schemaError.message;
    }
    // Safe logging: log field paths and issue codes without logging personal data or raw prompt contents
    console.error(`[GeminiService] Schema validation failed: ${diagnostic.slice(0, 300)}`);
    throw new GeminiServiceError("AI_SCHEMA_INVALID", diagnostic.slice(0, 300));
  }
}

export function isGeminiServiceError(error: unknown): error is GeminiServiceError {
  return error instanceof GeminiServiceError;
}
