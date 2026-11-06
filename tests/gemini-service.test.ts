import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateContent, getGeminiEnv } = vi.hoisted(() => ({
  generateContent: vi.fn(),
  getGeminiEnv: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(() => ({ models: { generateContent } })),
}));
vi.mock("@/config/env", () => ({ getGeminiEnv }));

import {
  DEFAULT_MODEL,
  GeminiServiceError,
  generateStructuredJson,
  normalizeModelName,
} from "@/server/ai/gemini-service";

describe("Gemini service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGeminiEnv.mockReturnValue({
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-3.5-flash-lite",
    });
  });

  it("fails safely when the API key is missing", async () => {
    getGeminiEnv.mockReturnValue({ GEMINI_API_KEY: undefined });

    await expect(generateStructuredJson("prompt", {}, (value) => value))
      .rejects.toMatchObject({ code: "AI_UNAVAILABLE" });
  });

  it("classifies empty model output", async () => {
    generateContent.mockResolvedValue({ text: "  " });

    await expect(generateStructuredJson("prompt", {}, (value) => value))
      .rejects.toMatchObject({ code: "AI_EMPTY_RESPONSE" });
  });

  it("classifies malformed JSON separately from schema-invalid output", async () => {
    generateContent.mockResolvedValue({ text: "not-json" });
    await expect(generateStructuredJson("prompt", {}, (value) => value))
      .rejects.toMatchObject({ code: "AI_MALFORMED_JSON" });

    generateContent.mockResolvedValue({ text: JSON.stringify({ unexpected: true }) });
    await expect(generateStructuredJson("prompt", {}, () => {
      throw new Error("schema invalid");
    })).rejects.toMatchObject({ code: "AI_SCHEMA_INVALID" });
  });

  it("strips markdown code fences from JSON output", async () => {
    generateContent.mockResolvedValue({
      text: "```json\n{\"destination\": \"Kerala\"}\n```",
    });

    await expect(generateStructuredJson(
      "prompt",
      { type: "OBJECT" },
      (value) => value as { destination: string },
    )).resolves.toEqual({ destination: "Kerala" });
  });

  it("returns parsed structured output without exposing the API response", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ destination: "Kerala" }) });

    await expect(generateStructuredJson(
      "prompt",
      { type: "OBJECT" },
      (value) => value as { destination: string },
    )).resolves.toEqual({ destination: "Kerala" });
  });

  it("uses the verified model configuration by default", async () => {
    generateContent.mockResolvedValue({ text: JSON.stringify({ status: "ok" }) });

    await generateStructuredJson(
      "prompt",
      { type: "OBJECT" },
      (value) => value,
    );

    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
      model: "gemini-3.5-flash-lite",
    }));
  });

  describe("model identifier normalization", () => {
    it("preserves already clean model names", () => {
      expect(normalizeModelName("gemini-3.5-flash-lite")).toBe("gemini-3.5-flash-lite");
    });

    it("strips single leading models/ prefix to prevent unexpected model format error", () => {
      expect(normalizeModelName("models/gemini-3.5-flash-lite")).toBe("gemini-3.5-flash-lite");
    });

    it("strips redundant nested models/ prefixes", () => {
      expect(normalizeModelName("models/models/gemini-3.5-flash-lite")).toBe("gemini-3.5-flash-lite");
    });

    it("strips wrapping quotes and whitespace from environment strings", () => {
      expect(normalizeModelName('  "gemini-3.5-flash-lite"  ')).toBe("gemini-3.5-flash-lite");
      expect(normalizeModelName("'models/gemini-3.5-flash-lite/'")).toBe("gemini-3.5-flash-lite");
    });

    it("falls back to DEFAULT_MODEL for invalid injection or malformed strings", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(normalizeModelName("invalid..model")).toBe(DEFAULT_MODEL);
      expect(normalizeModelName("")).toBe(DEFAULT_MODEL);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Invalid model configuration"));
      consoleSpy.mockRestore();
    });

    it("passes the normalized model name to the SDK when GEMINI_MODEL has a prefix", async () => {
      getGeminiEnv.mockReturnValue({
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "models/gemini-3.5-flash-lite",
      });
      generateContent.mockResolvedValue({ text: JSON.stringify({ test: "ok" }) });

      await generateStructuredJson(
        "prompt",
        { type: "OBJECT" },
        (value) => value,
      );

      expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({
        model: "gemini-3.5-flash-lite",
      }));
    });
  });

  it("classifies network failures without leaking provider details or keys", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateContent.mockRejectedValue(new Error("provider quota failed with key=AIzaSySecretKey123456789012345678901234"));

    let error: GeminiServiceError | undefined;
    try {
      await generateStructuredJson("prompt", {}, (value) => value);
    } catch (value) {
      error = value as GeminiServiceError;
    }

    expect(error).toMatchObject({ code: "AI_REQUEST_FAILED" });
    expect(error?.message).toBe("AI_REQUEST_FAILED");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("key=[REDACTED]"));
    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("AIzaSySecretKey"));
    consoleSpy.mockRestore();
  });

  it("logs safe diagnostics on schema validation failures", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    generateContent.mockResolvedValue({ text: JSON.stringify({ destination: 123 }) });

    await expect(generateStructuredJson("prompt", {}, () => {
      throw new Error("Expected string, received number");
    })).rejects.toMatchObject({ code: "AI_SCHEMA_INVALID" });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Schema validation failed"));
    consoleSpy.mockRestore();
  });

  it("times out a stalled provider request", async () => {
    vi.useFakeTimers();
    generateContent.mockReturnValue(new Promise(() => {}));

    const request = generateStructuredJson("prompt", {}, (value) => value);
    const timeoutAssertion = expect(request).rejects.toMatchObject({ code: "AI_TIMEOUT" });
    await vi.advanceTimersByTimeAsync(20_001);

    await timeoutAssertion;
    vi.useRealTimers();
  });
});
