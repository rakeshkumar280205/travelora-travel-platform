import Link from "next/link";

import { getStaffSession } from "@/server/services/authorization";
import { getAdminPackages } from "@/server/services/package-service";
import { PackageList } from "@/components/admin/package-list";

export const instant = false;

export default async function AdminPackagesPage() {
  const [packages, session] = await Promise.all([
    getAdminPackages(),
    getStaffSession(),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Content</p>
          <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Packages</h1>
          <p className="mt-4 text-sm leading-7 text-charcoal/60">
            Manage the journeys currently stored in Travelora.
          </p>
        </div>
        {session && session.user.role !== "CONSULTANT" && (
          <Link
            href="/admin/packages/new"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-deep-green hover:bg-forest hover:text-white"
          >
            Create package
          </Link>
        )}
      </header>
      <PackageList
        packages={packages.map((packageRecord) => ({
          id: packageRecord.id,
          slug: packageRecord.slug,
          title: packageRecord.title,
          destination: packageRecord.destination,
          durationDays: packageRecord.durationDays,
          hotelCategory: packageRecord.hotelCategory,
          status: packageRecord.status,
          updatedAt: packageRecord.updatedAt.toISOString(),
        }))}
        canMutate={session?.user.role !== "CONSULTANT"}
      />
    </div>
  );
}
