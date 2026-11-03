import "server-only";

import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { getAuthEnv } from "@/config/env";
import { credentialsSchema } from "@/lib/validation/auth-schemas";
import { findUserByEmail } from "@/server/repositories/user-repository";

export function getAuthOptions(): NextAuthOptions {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const AUTH_SECRET = isBuild
    ? "travelora-build-only-secret"
    : getAuthEnv().AUTH_SECRET;

  return {
    secret: AUTH_SECRET,
    session: { strategy: "jwt" },
    providers: [
      CredentialsProvider({
        name: "Staff credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            return null;
          }

          const user = await findUserByEmail(parsed.data.email);
          if (
            !user ||
            !(await bcrypt.compare(parsed.data.password, user.passwordHash))
          ) {
            return null;
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.role = user.role;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id;
          session.user.role = token.role;
        }
        return session;
      },
    },
  };
}
