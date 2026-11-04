import { notFound, redirect } from "next/navigation";

import { PackageForm } from "@/components/admin/package-form";
import { VersionHistory } from "@/components/admin/version-history";
import { getStaffSession } from "@/server/services/authorization";
import { getAdminPackages } from "@/server/services/package-service";

export const instant = false;

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, packages] = await Promise.all([
    getStaffSession(),
    getAdminPackages(),
  ]);
  if (!session || session.user.role === "CONSULTANT") {
    redirect("/admin/packages");
  }
  const { id } = await params;
  const packageRecord = packages.find((item) => item.id === id);
  if (!packageRecord) notFound();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Content</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Edit package</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Update package content, itinerary and indicative seasonal pricing.
        </p>
      </header>
      <PackageForm
        packageId={packageRecord.id}
        initial={{
          slug: packageRecord.slug,
          title: packageRecord.title,
          destination: packageRecord.destination,
          durationDays: packageRecord.durationDays,
          description: packageRecord.description,
          category: packageRecord.category,
          hotelCategory: packageRecord.hotelCategory,
          status: packageRecord.status,
          seasonalPrices: packageRecord.seasonalPrices.map((price) => ({
            seasonName: price.seasonName,
            startDate: toDateInput(price.startDate),
            endDate: toDateInput(price.endDate),
            amount: String(price.amount),
            currency: price.currency,
            pricingBasis: price.pricingBasis,
          })),
          itineraryDays: packageRecord.itineraryDays.map((day) => ({
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
          })),
        }}
      />
      <VersionHistory
        packageId={packageRecord.id}
        canRollback={session.user.role !== "CONSULTANT"}
      />
    </div>
  );
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
