import "server-only";

import { GoogleGenAI } from "@google/genai";

import { getGeminiEnv } from "@/config/env";

const MODEL = "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = 20_000;

export class GeminiServiceError extends Error {
  constructor(
    public readonly code:
      | "AI_UNAVAILABLE"
      | "AI_TIMEOUT"
      | "AI_INVALID_RESPONSE"
      | "AI_REQUEST_FAILED",
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
  const client = getClient();
  const request = client.models.generateContent({
    model: MODEL,
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
    throw new GeminiServiceError("AI_REQUEST_FAILED");
  }

  const text = response.text?.trim();
  if (!text) throw new GeminiServiceError("AI_INVALID_RESPONSE");
  try {
    return parse(JSON.parse(text));
  } catch {
    throw new GeminiServiceError("AI_INVALID_RESPONSE");
  }
}

export function isGeminiServiceError(error: unknown): error is GeminiServiceError {
  return error instanceof GeminiServiceError;
}
