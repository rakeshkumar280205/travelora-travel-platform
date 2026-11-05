"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";

export type PackageOption = {
  id: string;
  title: string;
  destination: string;
  durationDays: number;
  category: string;
  seasonalPrices: Array<{
    id: string;
    seasonName: string;
    startDate: string;
    endDate: string;
    amount: string;
    currency: string;
    pricingBasis: string;
  }>;
};

export type EnquiryOption = {
  id: string;
  customerName: string;
  email: string;
  phone?: string | null;
  destination: string;
  travelMonth?: string | null;
  startDate?: string | null;
  durationDays?: number | null;
  adults: number;
  children?: number | null;
  packageId?: string | null;
};

export function QuoteForm({
  packages,
  enquiries,
  initialEnquiryId,
}: {
  packages: PackageOption[];
  enquiries: EnquiryOption[];
  initialEnquiryId?: string;
}) {
  const router = useRouter();

  // Find initial enquiry if passed
  const initialEnquiry = useMemo(() => {
    return enquiries.find((e) => e.id === initialEnquiryId);
  }, [enquiries, initialEnquiryId]);

  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>(initialEnquiryId || "");
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    initialEnquiry?.packageId || (packages[0]?.id ?? "")
  );

  const [customerName, setCustomerName] = useState(initialEnquiry?.customerName || "");
  const [customerEmail, setCustomerEmail] = useState(initialEnquiry?.email || "");
  const [customerPhone, setCustomerPhone] = useState(initialEnquiry?.phone || "");
  const [startDate, setStartDate] = useState(
    initialEnquiry?.startDate ? initialEnquiry.startDate.slice(0, 10) : ""
  );
  const [adults, setAdults] = useState<number>(initialEnquiry?.adults || 2);
  const [children, setChildren] = useState<number>(initialEnquiry?.children || 0);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [errorDetails, setErrorDetails] = useState<string>("");

  const currentPackage = useMemo(() => {
    return packages.find((p) => p.id === selectedPackageId);
  }, [packages, selectedPackageId]);

  // When package changes, update duration and reset season if not in package
  const durationDays = currentPackage?.durationDays || 5;

  // Handle enquiry selection change
  function onEnquiryChange(eId: string) {
    setSelectedEnquiryId(eId);
    if (!eId) return;

    const enq = enquiries.find((e) => e.id === eId);
    if (!enq) return;

    setCustomerName(enq.customerName);
    setCustomerEmail(enq.email);
    if (enq.phone) setCustomerPhone(enq.phone);
    if (enq.adults) setAdults(enq.adults);
    if (enq.children !== null && enq.children !== undefined) setChildren(enq.children);
    if (enq.startDate) setStartDate(enq.startDate.slice(0, 10));
    if (enq.packageId && packages.some((p) => p.id === enq.packageId)) {
      setSelectedPackageId(enq.packageId);
    }
  }

  // Automatic seasonal matching
  const matchingSeason = useMemo(() => {
    if (!currentPackage || currentPackage.seasonalPrices.length === 0) return null;

    if (selectedSeasonId) {
      return currentPackage.seasonalPrices.find((s) => s.id === selectedSeasonId) || null;
    }

    if (!startDate) return null;

    const target = new Date(startDate);
    if (isNaN(target.getTime())) return null;

    const matches = currentPackage.seasonalPrices.filter((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return target >= start && target <= end;
    });

    if (matches.length === 1) return matches[0];
    return null;
  }, [currentPackage, selectedSeasonId, startDate]);

  // Calculation values
  const rateAmount = matchingSeason ? Number(matchingSeason.amount) : 0;
  const adultSubtotal = adults * rateAmount;
  const calculatedTotal = adultSubtotal;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setErrorDetails("");

    try {
      const payload = {
        enquiryId: selectedEnquiryId || null,
        packageId: selectedPackageId,
        seasonalPriceId: selectedSeasonId || (matchingSeason ? matchingSeason.id : null),
        customerName,
        customerEmail,
        customerPhone: customerPhone || null,
        startDate,
        durationDays,
        adults,
        children,
        notes: notes || null,
      };

      const response = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error?.message ?? "Failed to generate quotation.");
        if (result?.error?.details?.configuredWindows) {
          setErrorDetails(`Configured seasons: ${result.error.details.configuredWindows}`);
        }
        setSaving(false);
        return;
      }

      const newQuoteId = result?.data?.id;
      if (newQuoteId) {
        router.push(`/admin/quotes/${newQuoteId}`);
      } else {
        router.push("/admin/quotes");
      }
    } catch {
      setError("A network error occurred while communicating with the quotation engine.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 text-red-600 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">{error}</p>
              {errorDetails && <p className="mt-1 text-xs text-red-800">{errorDetails}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Origin Enquiry Context (if applicable) */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Enquiry association</h2>
        <p className="mt-1 text-xs text-charcoal/60">
          Link this quote to an existing client enquiry to keep communications synchronized.
        </p>

        <div className="mt-5 max-w-xl">
          <label htmlFor="quote-enquiry-select" className="block text-sm font-medium text-forest">
            Associated Guest Enquiry
          </label>
          <select
            id="quote-enquiry-select"
            value={selectedEnquiryId}
            onChange={(e) => onEnquiryChange(e.target.value)}
            className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm font-normal outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
          >
            <option value="">Direct / Walk-in Quote (No linked enquiry)</option>
            {enquiries.map((enq) => (
              <option key={enq.id} value={enq.id}>
                {enq.customerName} — {enq.destination} ({enq.adults} adults)
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Guest Details */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Guest details</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          <div>
            <label htmlFor="quote-customer-name" className="block text-sm font-medium text-forest">
              Guest Full Name <span className="text-red-600">*</span>
            </label>
            <input
              id="quote-customer-name"
              type="text"
              required
              aria-required="true"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label htmlFor="quote-customer-email" className="block text-sm font-medium text-forest">
              Guest Email Address <span className="text-red-600">*</span>
            </label>
            <input
              id="quote-customer-email"
              type="email"
              required
              aria-required="true"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>

          <div>
            <label htmlFor="quote-customer-phone" className="block text-sm font-medium text-forest">
              Guest Phone Number
            </label>
            <input
              id="quote-customer-phone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
          </div>
        </div>
      </section>

      {/* Journey & Seasonal Pricing Selection */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest">Journey & seasonal schedule</h2>
          <span className="text-xs uppercase tracking-wider text-gold font-semibold">
            Database-backed rates
          </span>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="quote-package-select" className="block text-sm font-medium text-forest">
              Select Published Journey <span className="text-red-600">*</span>
            </label>
            <select
              id="quote-package-select"
              required
              value={selectedPackageId}
              onChange={(e) => {
                setSelectedPackageId(e.target.value);
                setSelectedSeasonId("");
              }}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.title} ({pkg.destination} · {pkg.durationDays} Days)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="quote-start-date" className="block text-sm font-medium text-forest">
              Travel Start Date <span className="text-red-600">*</span>
            </label>
            <input
              id="quote-start-date"
              type="date"
              required
              aria-required="true"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
            <p className="mt-1 text-xs text-charcoal/50">
              The seasonal tariff is strictly derived from this calendar date.
            </p>
          </div>
        </div>

        {/* Available database seasons for this package */}
        {currentPackage && (
          <div className="mt-6 rounded-xl border border-charcoal/10 bg-ivory/50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-forest">
              Database Seasonal Tariffs for {currentPackage.title}:
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentPackage.seasonalPrices.map((season) => {
                const isAutoMatched = matchingSeason?.id === season.id;
                const isSelected = selectedSeasonId === season.id || (!selectedSeasonId && isAutoMatched);

                return (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => setSelectedSeasonId(season.id)}
                    className={`flex flex-col text-left rounded-lg p-3.5 border transition cursor-pointer ${
                      isSelected
                        ? "border-forest bg-white shadow-sm ring-2 ring-gold/40"
                        : "border-charcoal/15 bg-white hover:border-charcoal/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-forest text-sm">{season.seasonName}</span>
                      {isSelected && (
                        <CheckCircle2 size={15} className="text-forest" aria-hidden="true" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-charcoal/60">
                      {new Date(season.startDate).toISOString().slice(0, 10)} to{" "}
                      {new Date(season.endDate).toISOString().slice(0, 10)}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-deep-green">
                      {season.currency} {Number(season.amount).toLocaleString("en-IN")}{" "}
                      <span className="font-normal text-charcoal/50">({season.pricingBasis.slice(0, 20)})</span>
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Travellers configuration */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="quote-adults-input" className="block text-sm font-medium text-forest">
              Adult Travellers <span className="text-red-600">*</span>
            </label>
            <input
              id="quote-adults-input"
              type="number"
              min={1}
              max={50}
              required
              value={adults}
              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
            <p className="mt-1 text-xs text-charcoal/50">Adults are charged the full seasonal package rate.</p>
          </div>

          <div>
            <label htmlFor="quote-children-input" className="block text-sm font-medium text-forest">
              Child Travellers (Under 12)
            </label>
            <input
              id="quote-children-input"
              type="number"
              min={0}
              max={20}
              value={children}
              onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
              className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
            />
            <p className="mt-1 text-xs text-charcoal/50">
              Children remain unpriced in indicative quotations; confirmed per room policy.
            </p>
          </div>
        </div>
      </section>

      {/* Live Calculation Preview Card */}
      <section className="border border-forest/20 bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-gold" aria-hidden="true" />
          <h2 className="font-display text-2xl text-forest">Transparent quotation breakdown</h2>
        </div>

        <div className="mt-6 divide-y divide-charcoal/10 border border-charcoal/15 bg-ivory/40">
          <div className="flex items-center justify-between p-4 text-sm">
            <div>
              <span className="font-medium text-forest">Adult Tariff ({adults} Guest{adults > 1 ? "s" : ""}):</span>
              <p className="text-xs text-charcoal/60">
                {matchingSeason
                  ? `${matchingSeason.currency} ${Number(matchingSeason.amount).toLocaleString("en-IN")} × ${adults} Adults`
                  : "Select a date to resolve seasonal rate"}
              </p>
            </div>
            <span className="font-semibold text-forest">
              {matchingSeason
                ? `${matchingSeason.currency} ${adultSubtotal.toLocaleString("en-IN")}`
                : "--"}
            </span>
          </div>

          <div className="flex items-center justify-between p-4 text-sm">
            <div>
              <span className="font-medium text-forest">Child Travellers ({children}):</span>
              <p className="text-xs text-charcoal/60">
                {children > 0
                  ? "Unpriced — Subject to hotel room sharing & extra bed policies"
                  : "No children configured"}
              </p>
            </div>
            <span className="text-xs text-charcoal/50 italic">
              {children > 0 ? "Subject to confirmation" : "--"}
            </span>
          </div>

          <div className="flex items-center justify-between bg-forest/5 p-4 text-base font-semibold">
            <span className="text-forest">Indicative Adult Subtotal:</span>
            <span className="font-display text-xl text-forest">
              {matchingSeason
                ? `${matchingSeason.currency} ${calculatedTotal.toLocaleString("en-IN")}`
                : "--"}
            </span>
          </div>
        </div>

        {/* Governance & Policy Disclaimers */}
        <div className="mt-5 rounded-lg border border-gold/40 bg-gold/10 p-4 text-xs leading-relaxed text-deep-green">
          <p className="font-semibold">Governance and Price Integrity Disclaimers:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>GST treatment is subject to confirmation upon final reservation billing.</li>
            <li>No artificial discounts, flights, or unlisted excursions are assumed.</li>
            <li>Rates are strictly drawn from database records without AI price estimation.</li>
          </ul>
        </div>
      </section>

      {/* Internal Consultant Notes */}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <label htmlFor="quote-notes" className="block text-sm font-medium text-forest">
          Special Notes & Custom Inclusions for Client
        </label>
        <textarea
          id="quote-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Complimentary private tea plantation walk included; airport vehicle upgraded to premium SUV..."
          className="mt-2 w-full border border-charcoal/20 bg-ivory p-4 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
        />
      </section>

      {/* Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-charcoal/10 pt-6">
        <Link href="/admin/quotes" className="text-sm font-medium text-charcoal/70 hover:text-forest underline">
          Cancel and return to list
        </Link>

        <button
          type="submit"
          disabled={saving || !matchingSeason}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-8 text-sm font-medium text-deep-green hover:bg-forest hover:text-white disabled:opacity-50 transition cursor-pointer"
        >
          {saving ? "Generating snapshot..." : "Generate formal quotation"}
        </button>
      </div>
    </form>
  );
}
