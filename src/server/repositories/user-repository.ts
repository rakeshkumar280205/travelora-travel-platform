import "server-only";

import { prisma } from "@/server/db/client";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}
