import { Suspense } from "react";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PackageDiscovery } from "@/features/packages/package-discovery";
import { getDiscoveryPackages } from "@/features/packages/package-data";

async function PackageResults() {
  const packages = await getDiscoveryPackages();
  return <PackageDiscovery packages={packages} />;
}

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        <section className="bg-deep-green px-6 pb-20 pt-36 text-white sm:px-10 lg:px-16">
          <div className="mx-auto max-w-7xl">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-gold">
              <span className="h-px w-10 bg-gold" />
              The collection
            </p>
            <h1 className="font-display mt-6 max-w-3xl text-5xl leading-[0.98] tracking-[-0.03em] sm:text-7xl">
              Journeys with a sense of place.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">
              Explore considered routes through South India, with space to
              discover the details that make a journey yours.
            </p>
          </div>
        </section>
        <section className="px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <Suspense fallback={<div className="min-h-96" />}>
              <PackageResults />
            </Suspense>
            <p className="mt-12 max-w-2xl text-xs leading-5 text-charcoal/50">
              Prices shown are indicative package pricing per person where
              available. They are not a verified final quotation; GST treatment
              and final inclusions are to be confirmed.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
