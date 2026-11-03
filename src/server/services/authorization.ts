import "server-only";

import { getServerSession } from "next-auth";

import { getAuthOptions } from "@/auth";

export async function getStaffSession() {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.id || !session.user.role) {
    return null;
  }
  return session;
}

export async function hasStaffRole(
  roles: Array<"ADMIN" | "EDITOR" | "CONSULTANT">
) {
  const session = await getStaffSession();
  return session && roles.includes(session.user.role) ? session : null;
}
