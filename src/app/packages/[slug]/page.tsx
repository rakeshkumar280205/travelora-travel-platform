import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import type { Metadata } from "next";

import { getSiteUrl } from "@/config/env";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { ResilientImage } from "@/components/ui/resilient-image";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PackageCard } from "@/components/travel/package-card";
import {
  formatAmount,
  getPackageImage,
  getPackageFallbackImage,
} from "@/features/packages/package-types";
import {
  getPublishedPackageBySlug,
  getRelatedPublishedPackages,
} from "@/server/services/package-service";

type PackagePageProps = {
  params: Promise<{ slug: string }>;
};

export const instant = false;

async function getPackage(slug: string) {
  await connection();
  return getPublishedPackageBySlug(slug);
}

export async function generateMetadata({
  params,
}: PackagePageProps): Promise<Metadata> {
  const { slug } = await params;
  const packageRecord = await getPackage(slug);

  if (!packageRecord) {
    return {
      title: "Journey not found | Travelora",
      robots: { index: false, follow: false },
    };
  }

  const description = `${packageRecord.title} — a ${packageRecord.durationDays}-day journey through ${packageRecord.destination} with Travelora.`;
  const siteUrl = getSiteUrl();
  const canonicalUrl = siteUrl
    ? new URL(`/packages/${packageRecord.slug}`, siteUrl).toString()
    : undefined;

  return {
    title: `${packageRecord.title} | Travelora`,
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      title: `${packageRecord.title} | Travelora`,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      type: "article",
      images: [{ url: getPackageImage(packageRecord.destination), alt: packageRecord.title }],
    },
  };
}

export default async function PackageDetailPage({ params }: PackagePageProps) {
  const { slug } = await params;
  const packageRecord = await getPackage(slug);

  if (!packageRecord) notFound();

  const relatedPackages = await getRelatedPublishedPackages(packageRecord.slug);
  const validPrices = packageRecord.seasonalPrices.filter((price) => {
    const amount = Number(price.amount);
    return Number.isFinite(amount) && amount > 0;
  });
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        <section className="relative isolate min-h-[620px] bg-deep-green text-white">
          <ResilientImage
            src={getPackageImage(packageRecord.destination)}
            fallbackSrc={getPackageFallbackImage(packageRecord.destination)}
            alt={`${packageRecord.destination} landscape`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-deep-green via-deep-green/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-deep-green/75 to-transparent" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-end px-6 pb-16 pt-36 sm:px-10 lg:px-16 lg:pb-24">
            <div className="max-w-4xl">
              <nav aria-label="Breadcrumb" className="mb-10 text-xs text-white/65">
                <ol className="flex flex-wrap items-center gap-2">
                  <li><Link href="/" className="hover:text-white">Home</Link></li>
                  <li aria-hidden="true">/</li>
                  <li><Link href="/packages" className="hover:text-white">Journeys</Link></li>
                  <li aria-hidden="true">/</li>
                  <li className="text-white/90">{packageRecord.title}</li>
                </ol>
              </nav>
              <p className="text-xs uppercase tracking-[0.28em] text-gold">
                {packageRecord.destination} · {packageRecord.durationDays} days · {packageRecord.hotelCategory}
              </p>
              <h1 className="font-display mt-6 max-w-4xl text-5xl leading-[0.98] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
                {packageRecord.title}
              </h1>
              <Button href="#enquire" className="mt-8">
                Enquire about this journey <span aria-hidden="true">↗</span>
              </Button>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">The journey</p>
              <h2 className="font-display mt-5 text-4xl leading-tight text-forest sm:text-5xl">
                A considered way into {packageRecord.destination}.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-charcoal/65">
                {packageRecord.description}
              </p>
              <div className="mt-10 border-t border-charcoal/15 pt-6">
                <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
                  Destination highlights
                </h3>
                <p className="mt-3 text-sm leading-7 text-charcoal/60">
                  This package covers {packageRecord.destination}. Specific highlights are shaped by the stored itinerary below and confirmed with your travel consultant.
                </p>
              </div>
            </div>
            <aside className="h-fit border border-charcoal/15 bg-white p-7">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">Package information</p>
              <dl className="mt-6 space-y-5 text-sm">
                <InfoRow label="Destination" value={packageRecord.destination} />
                <InfoRow label="Duration" value={`${packageRecord.durationDays} days`} />
                <InfoRow label="Accommodation" value={packageRecord.hotelCategory} />
                <InfoRow label="Category" value={packageRecord.category} />
              </dl>
            </aside>
          </div>
        </section>

        <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Day by day</p>
              <h2 className="font-display mt-5 text-4xl text-forest sm:text-5xl">The itinerary</h2>
              <div className="mt-8 divide-y divide-charcoal/15 border-y border-charcoal/15">
                {packageRecord.itineraryDays.length > 0 ? (
                  packageRecord.itineraryDays.map((day, index) => (
                    <details key={day.id} open={index === 0} className="group py-5">
                      <summary className="flex cursor-pointer list-none items-center gap-3 sm:gap-5 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold [&::-webkit-details-marker]:hidden">
                        <span className="text-xs uppercase tracking-[0.18em] text-gold shrink-0">Day {day.dayNumber}</span>
                        <span className="font-display text-xl sm:text-2xl text-forest">{day.title}</span>
                        <span className="ml-auto text-2xl font-light text-charcoal/40 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                      </summary>
                      <p className="max-w-2xl pl-0 sm:pl-[4.5rem] pt-4 text-sm leading-7 text-charcoal/65">
                        {day.description}
                      </p>
                    </details>
                  ))
                ) : (
                  <p className="py-6 text-sm leading-6 text-charcoal/60">
                    A detailed itinerary is not stored for this journey yet. Your travel consultant will shape the day-by-day plan with you.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-8">
              <InfoPanel
                title="Accommodation"
                body={`${packageRecord.hotelCategory} accommodation is included as the stored hotel category for this package. Specific properties are to be confirmed.`}
              />
              <InfoPanel
                title="Inclusions"
                body="Detailed inclusions are not stored for this package. Please confirm inclusions and exclusions with your travel consultant before booking."
              />
            </div>
          </div>
        </section>

        <section className="bg-ivory px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Plan with clarity</p>
              <h2 className="font-display mt-5 text-4xl text-forest sm:text-5xl">Seasonal pricing</h2>
              <p className="mt-5 text-sm leading-7 text-charcoal/60">
                Pricing below is the stored indicative package pricing. It is not a verified final quotation.
              </p>
            </div>
            {validPrices.length > 0 ? (
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {validPrices.map((price) => (
                  <article key={price.id} className="border border-charcoal/15 bg-white p-6">
                    <p className="text-xs uppercase tracking-[0.18em] text-gold">{price.seasonName}</p>
                    <p className="font-display mt-4 text-4xl text-forest">
                      {formatAmount(Number(price.amount), price.currency)}
                    </p>
                    <p className="mt-2 text-sm text-charcoal/55">
                      {formatDate(price.startDate)} — {formatDate(price.endDate)}
                    </p>
                    <p className="mt-5 border-t border-charcoal/10 pt-4 text-xs leading-5 text-charcoal/60">
                      {price.pricingBasis}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-10 border border-charcoal/15 bg-white p-6 text-sm text-charcoal/60">
                Price on request. No valid seasonal price is stored for this journey.
              </p>
            )}
            <p className="mt-6 max-w-2xl text-xs leading-5 text-charcoal/50">
              GST treatment and final inclusions are to be confirmed. No child pricing, availability, or final quotation is represented here.
            </p>
          </div>
        </section>

        {relatedPackages.length > 0 && (
          <section className="bg-white px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
            <div className="mx-auto max-w-7xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gold">Keep exploring</p>
              <h2 className="font-display mt-5 text-4xl text-forest sm:text-5xl">More ways south</h2>
              <div className="mt-10 grid gap-8 md:grid-cols-3">
                {relatedPackages.map((related) => (
                  <PackageCard
                    key={related.id}
                    slug={related.slug}
                    title={related.title}
                    destination={related.destination}
                    durationDays={related.durationDays}
                    description={related.description}
                    hotelCategory={related.hotelCategory}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="enquire" className="bg-gold px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-deep-green/70">Make it yours</p>
              <h2 className="font-display mt-3 text-4xl text-deep-green">Ready to begin?</h2>
              <p className="mt-3 max-w-lg text-sm text-deep-green/70">
                Share your travel plans and our team will review the details for this journey.
              </p>
            </div>
            <EnquiryForm packageSlug={packageRecord.slug} destination={packageRecord.destination} />
          </div>
        </section>
      </main>
      <div className="sticky bottom-0 z-10 border-t border-deep-green/10 bg-deep-green p-3 sm:hidden">
        <Button href="#enquire" className="w-full">
          Enquire about this journey
        </Button>
      </div>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-charcoal/10 pb-4 last:border-0 last:pb-0">
      <dt className="text-charcoal/55">{label}</dt>
      <dd className="text-right font-medium text-forest">{value}</dd>
    </div>
  );
}

function InfoPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="border border-charcoal/15 bg-ivory p-7">
      <h3 className="font-display text-2xl text-forest">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-charcoal/60">{body}</p>
    </section>
  );
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}
