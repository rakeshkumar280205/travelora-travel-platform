import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Calendar, Download, MapPin, ShieldCheck, Users } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getPublicQuote } from "@/server/services/quote-service";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  try {
    const quote = await getPublicQuote(token);
    return {
      title: `Travel Quotation ${quote.quoteNumber} | Travelora`,
      description: `Official travel quotation for ${quote.package.title} curated by Travelora Private Travel Atelier.`,
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Quotation Not Found | Travelora",
      robots: { index: false, follow: false },
    };
  }
}

export default async function PublicQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;

  let quote;
  try {
    quote = await getPublicQuote(token);
  } catch {
    notFound();
  }

  if (!quote) notFound();

  return (
    <div className="min-h-screen bg-ivory">
      <Header />

      {/* Hero Header */}
      <section className="bg-forest px-6 pb-20 pt-36 text-white sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gold/20 px-3 py-1 font-mono text-xs uppercase tracking-widest text-gold">
              Ref: {quote.quoteNumber}
            </span>
            <span className="text-xs text-white/60">
              Issued {new Date(quote.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>

          <h1 className="font-display mt-6 text-3xl sm:text-4xl md:text-5xl text-ivory leading-tight">
            Curated Quotation: {quote.package.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl font-light leading-relaxed">
            Prepared exclusively for <strong className="font-medium text-white">{quote.customerName}</strong>.
            This schedule reflects verified published seasonal rates and bespoke route planning.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={`/api/quotes/preview/${token}/pdf`}
              download
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-6 text-xs font-semibold text-deep-green hover:bg-white transition shadow-sm"
            >
              <Download size={14} aria-hidden="true" /> Download Official PDF Quote
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:px-16 space-y-10">
        {/* Guest & Journey Snapshot */}
        <section className="rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Journey profile</h2>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-ivory p-4 border border-charcoal/5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                <MapPin size={13} aria-hidden="true" /> Destination
              </span>
              <p className="mt-2 text-sm font-medium text-forest">
                {quote.package.destination} ({quote.package.durationDays} Days)
              </p>
            </div>

            <div className="rounded-xl bg-ivory p-4 border border-charcoal/5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                <Calendar size={13} aria-hidden="true" /> Travel Window
              </span>
              <p className="mt-2 text-sm font-medium text-forest">
                {quote.startDate
                  ? `${quote.startDate.slice(0, 10)}${quote.endDate ? ` to ${quote.endDate.slice(0, 10)}` : ""}`
                  : "Flexible scheduling"}
              </p>
            </div>

            <div className="rounded-xl bg-ivory p-4 border border-charcoal/5">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                <Users size={13} aria-hidden="true" /> Travellers
              </span>
              <p className="mt-2 text-sm font-medium text-forest">
                {quote.adults} Adult(s){quote.children > 0 ? `, ${quote.children} Child(ren)` : ""}
              </p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-charcoal/70">
            {quote.package.description}
          </p>
        </section>

        {/* Pricing Table */}
        <section className="rounded-2xl border border-forest/15 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-forest">Pricing schedule</h2>
            <span className="text-xs uppercase tracking-wider text-gold font-semibold">
              Verified Seasonal Tariff
            </span>
          </div>

          <div className="mt-6 overflow-hidden rounded-xl border border-charcoal/15">
            <table className="w-full text-left text-sm">
              <thead className="bg-forest text-white text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold">Price Basis</th>
                  <th className="p-4 font-semibold">Rate</th>
                  <th className="p-4 font-semibold text-right">Indicative Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/10 bg-ivory/30">
                <tr>
                  <td className="p-4 font-medium text-forest">
                    Adult Journey Package ({quote.adults} Guest{quote.adults > 1 ? "s" : ""})
                  </td>
                  <td className="p-4 text-xs text-charcoal/60">{quote.pricing.pricingBasis}</td>
                  <td className="p-4 text-charcoal/80">
                    {quote.pricing.currency} {Number(quote.pricing.basePriceAmount).toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 text-right font-semibold text-forest">
                    {quote.pricing.currency} {Number(quote.pricing.calculatedTotal).toLocaleString("en-IN")}
                  </td>
                </tr>

                <tr>
                  <td className="p-4 font-medium text-forest">
                    Child Travellers ({quote.children})
                  </td>
                  <td className="p-4 text-xs text-charcoal/60 italic">
                    {quote.children > 0
                      ? "Unpriced — subject to hotel room share & bed rules"
                      : "No children configured"}
                  </td>
                  <td className="p-4 text-xs text-charcoal/50 italic">Unpriced</td>
                  <td className="p-4 text-right text-xs text-charcoal/50 italic">--</td>
                </tr>

                <tr className="bg-forest/5 font-semibold text-forest">
                  <td colSpan={3} className="p-4 text-base">
                    Indicative Subtotal (Excl. Unconfirmed GST):
                  </td>
                  <td className="p-4 text-right font-display text-xl text-forest">
                    {quote.pricing.currency} {Number(quote.pricing.calculatedTotal).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Governance & Disclaimers */}
          <div className="mt-6 rounded-xl border border-gold/40 bg-gold/10 p-5 text-xs text-deep-green leading-relaxed">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="mt-0.5 text-forest shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold text-forest">Terms and Tariff Policies:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li>GST treatment is subject to confirmation upon final reservation billing.</li>
                  <li>Children remain unpriced in indicative quotes and are finalized based on specific lodge room categories.</li>
                  <li>Quotation is indicative and subject to room availability at time of booking.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Itinerary Schedule */}
        {quote.package.itineraryDays && quote.package.itineraryDays.length > 0 && (
          <section className="rounded-2xl border border-charcoal/10 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="font-display text-2xl text-forest">Itinerary highlights</h2>
            <div className="mt-6 divide-y divide-charcoal/10">
              {quote.package.itineraryDays.map((day) => (
                <div key={day.dayNumber} className="py-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    Day {day.dayNumber}
                  </span>
                  <h3 className="mt-1 font-medium text-forest">{day.title}</h3>
                  <p className="mt-1 text-sm text-charcoal/70 leading-relaxed">{day.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
