import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getStaffSession } from "@/server/services/authorization";
import { AdminShell } from "@/components/admin/admin-shell";

export const instant = false;

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const session = await getStaffSession();

  if (!session) {
    redirect("/admin/signin");
  }

  return (
    <AdminShell
      user={{
        name: session.user.name ?? "Staff member",
        email: session.user.email ?? "",
        role: session.user.role,
      }}
    >
      {children}
    </AdminShell>
  );
}
