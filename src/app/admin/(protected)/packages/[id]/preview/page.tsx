import Link from "next/link";
import { notFound } from "next/navigation";

import { getAdminPackages } from "@/server/services/package-service";

export const instant = false;

export default async function PackagePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const packageRecord = (await getAdminPackages()).find((item) => item.id === id);
  if (!packageRecord) notFound();

  return (
    <div className="space-y-8">
      <div className="border border-gold/40 bg-gold/15 px-5 py-4 text-sm text-deep-green">
        <strong>DRAFT PREVIEW</strong> · This content is visible only to authenticated staff and is not public.
      </div>
      <header className="border border-charcoal/10 bg-white p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">{packageRecord.destination}</p>
        <h1 className="font-display mt-4 text-5xl text-forest">{packageRecord.title}</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-charcoal/65">{packageRecord.description}</p>
        <p className="mt-5 text-sm text-charcoal/55">
          {packageRecord.durationDays} days · {packageRecord.hotelCategory} · {packageRecord.status}
        </p>
      </header>
      <section className="grid gap-8 lg:grid-cols-2">
        <div className="border border-charcoal/10 bg-white p-6">
          <h2 className="font-display text-2xl text-forest">Itinerary</h2>
          <div className="mt-5 divide-y divide-charcoal/10">
            {packageRecord.itineraryDays.length > 0 ? packageRecord.itineraryDays.map((day) => (
              <div key={day.id} className="py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-gold">Day {day.dayNumber}</p>
                <h3 className="mt-2 font-medium text-forest">{day.title}</h3>
                <p className="mt-2 text-sm leading-6 text-charcoal/60">{day.description}</p>
              </div>
            )) : <p className="py-4 text-sm text-charcoal/55">No itinerary days added.</p>}
          </div>
        </div>
        <div className="border border-charcoal/10 bg-white p-6">
          <h2 className="font-display text-2xl text-forest">Seasonal pricing</h2>
          <div className="mt-5 divide-y divide-charcoal/10">
            {packageRecord.seasonalPrices.length > 0 ? packageRecord.seasonalPrices.map((price) => (
              <div key={price.id} className="py-4">
                <p className="font-medium text-forest">{price.seasonName}</p>
                <p className="mt-2 text-sm text-charcoal/60">{price.currency} {String(price.amount)} · {price.pricingBasis}</p>
              </div>
            )) : <p className="py-4 text-sm text-charcoal/55">No seasonal prices added.</p>}
          </div>
        </div>
      </section>
      <Link href={`/admin/packages/${id}/edit`} className="inline-flex min-h-12 items-center rounded-full bg-deep-green px-6 text-sm font-medium text-white hover:bg-forest">
        Back to editor
      </Link>
    </div>
  );
}
