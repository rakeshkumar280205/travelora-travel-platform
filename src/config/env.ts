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

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32),
});

const geminiEnvSchema = z.object({
  GEMINI_API_KEY: optionalNonEmptyString,
});

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function getCoreEnv() {
  return coreEnvSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
  });
}

export function getDatabaseEnv() {
  return databaseEnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
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
  });
}

export function getPublicEnv() {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}

export type CoreEnv = z.infer<typeof coreEnvSchema>;
export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type GeminiEnv = z.infer<typeof geminiEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;
