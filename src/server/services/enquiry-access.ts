import "server-only";

import { getStaffSession } from "@/server/services/authorization";

export async function getEnquiryStaffAccess() {
  const session = await getStaffSession();
  if (!session) return { session: null, role: null };
  if (!["ADMIN", "CONSULTANT"].includes(session.user.role)) {
    return { session, role: "FORBIDDEN" as const };
  }
  return { session, role: session.user.role };
}
