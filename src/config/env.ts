import "server-only";

import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().min(1).optional()
);

const coreEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

const databaseEnvSchema = z
  .object({
    DATABASE_URL: z.string().url(),
    DIRECT_URL: optionalNonEmptyString.pipe(z.string().url().optional()),
  })
  .superRefine((data, ctx) => {
    if (process.env.NODE_ENV === "production" && !data.DIRECT_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DIRECT_URL is required in production deployment.",
        path: ["DIRECT_URL"],
      });
    }
  });

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32),
});

const geminiEnvSchema = z.object({
  GEMINI_API_KEY: optionalNonEmptyString,
  GEMINI_MODEL: z.string().trim().min(1).default("gemini-3.5-flash-lite"),
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const rateLimitEnvSchema = z.object({
  UPSTASH_REDIS_REST_URL: optionalNonEmptyString,
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmptyString,
  RATE_LIMIT_PUBLIC_ENQUIRY_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW: z.string().trim().min(1).default("1 h"),
  RATE_LIMIT_AI_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AI_WINDOW: z.string().trim().min(1).default("1 m"),
});

export function getCoreEnv() {
  return coreEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
  });
}

export function getDatabaseEnv() {
  return databaseEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
  });
}

export function getAuthEnv() {
  return authEnvSchema.parse({
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });
}

export function getGeminiEnv() {
  return geminiEnvSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
  });
}

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export function getSiteUrl() {
  const { NEXT_PUBLIC_APP_URL } = getPublicEnv();
  if (!NEXT_PUBLIC_APP_URL) return null;
  return new URL(`${NEXT_PUBLIC_APP_URL.replace(/\/+$/, "")}/`);
}

export function getRateLimitEnv() {
  return rateLimitEnvSchema.parse({
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    RATE_LIMIT_PUBLIC_ENQUIRY_MAX: process.env.RATE_LIMIT_PUBLIC_ENQUIRY_MAX,
    RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW: process.env.RATE_LIMIT_PUBLIC_ENQUIRY_WINDOW,
    RATE_LIMIT_AI_MAX: process.env.RATE_LIMIT_AI_MAX,
    RATE_LIMIT_AI_WINDOW: process.env.RATE_LIMIT_AI_WINDOW,
  });
}

export type CoreEnv = z.infer<typeof coreEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type GeminiEnv = z.infer<typeof geminiEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type RateLimitEnv = z.infer<typeof rateLimitEnvSchema>;
