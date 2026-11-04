import { redirect } from "next/navigation";

import { PackageForm } from "@/components/admin/package-form";
import { getStaffSession } from "@/server/services/authorization";

export const instant = false;

export default async function NewPackagePage() {
  const session = await getStaffSession();
  if (!session || session.user.role === "CONSULTANT") {
    redirect("/admin/packages");
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Content</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Create package</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          New packages start as drafts. Publishing remains a separate workflow.
        </p>
      </header>
      <PackageForm
        initial={{
          slug: "",
          title: "",
          destination: "",
          durationDays: 1,
          description: "",
          category: "",
          hotelCategory: "",
          status: "DRAFT",
          seasonalPrices: [],
          itineraryDays: [],
        }}
      />
    </div>
  );
}
