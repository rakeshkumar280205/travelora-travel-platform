"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Lock,
  ShieldCheck,
  XCircle,
} from "lucide-react";

export type QuoteDetailData = {
  id: string;
  quoteNumber: string;
  status: "DRAFT" | "GENERATED" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  durationDays: number;
  adults: number;
  children: number;
  basePriceAmount: string;
  currency: string;
  pricingBasis: string;
  calculatedTotal: string;
  notes?: string | null;
  publicToken?: string | null;
  tokenExpiresAt?: string | null;
  isTokenRevoked: boolean;
  createdAt: string;
  sentAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  package: {
    id: string;
    slug: string;
    title: string;
    destination: string;
    durationDays: number;
    category: string;
    hotelCategory: string;
    description: string;
    itineraryDays: Array<{
      dayNumber: number;
      title: string;
      description: string;
    }>;
  };
  seasonalPrice?: {
    seasonName: string;
    startDate: string;
    endDate: string;
    amount: string;
    currency: string;
    pricingBasis: string;
  } | null;
  createdBy?: {
    name: string;
    email: string;
    role: string;
  } | null;
  enquiry?: {
    id: string;
    customerName: string;
    status: string;
  } | null;
  snapshot?: Record<string, unknown> | null;
};

export function QuoteDetailView({
  quote: initialQuote,
  canMutate,
}: {
  quote: QuoteDetailData;
  canMutate: boolean;
}) {
  const [quote, setQuote] = useState(initialQuote);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const publicLink = quote.publicToken && !quote.isTokenRevoked
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/quotes/${quote.publicToken}`
    : "";

  async function updateStatus(newStatus: QuoteDetailData["status"]) {
    if (!canMutate) return;
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        setErrorMessage(error?.error?.message ?? "Failed to update quotation status.");
        setBusy(false);
        return;
      }

      setQuote((prev) => ({ ...prev, status: newStatus }));
      setMessage(`Status updated to ${newStatus}.`);
    } catch {
      setErrorMessage("Network error updating status.");
    } finally {
      setBusy(false);
    }
  }

  async function manageLink(action: "create" | "revoke") {
    if (!canMutate) return;
    setBusy(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const res = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(res?.error?.message ?? "Failed to update guest share link.");
        setBusy(false);
        return;
      }

      setQuote((prev) => ({
        ...prev,
        publicToken: res.data.publicToken,
        isTokenRevoked: res.data.isTokenRevoked,
        tokenExpiresAt: res.data.tokenExpiresAt,
      }));

      setMessage(
        action === "create"
          ? "Secure guest link created successfully."
          : "Guest share link has been revoked."
      );
    } catch {
      setErrorMessage("Network error managing share link.");
    } finally {
      setBusy(false);
    }
  }

  function copyLinkToClipboard() {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function getStatusBadgeStyle(status: QuoteDetailData["status"]) {
    switch (status) {
      case "DRAFT":
        return "bg-charcoal/10 text-charcoal";
      case "GENERATED":
        return "bg-gold/20 text-deep-green font-semibold";
      case "SENT":
        return "bg-sky-100 text-sky-900";
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-900 font-semibold";
      case "REJECTED":
        return "bg-rose-100 text-rose-900";
      case "EXPIRED":
        return "bg-gray-100 text-gray-500 line-through";
      default:
        return "bg-charcoal/10 text-charcoal";
    }
  }

  return (
    <div className="space-y-8">
      {/* Return link */}
      <div>
        <Link
          href="/admin/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-charcoal/60 hover:text-forest transition"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Return to quotations
        </Link>
      </div>

      {/* Header Panel */}
      <header className="flex flex-col gap-6 rounded-xl border border-charcoal/10 bg-white p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-mono text-2xl font-bold text-forest sm:text-3xl">
              {quote.quoteNumber}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-wider ${getStatusBadgeStyle(
                quote.status
              )}`}
            >
              {quote.status}
            </span>
          </div>

          <p className="mt-2 text-sm text-charcoal/60">
            Issued {new Date(quote.createdAt).toLocaleDateString("en-IN")} · Created by{" "}
            {quote.createdBy?.name || "Private Atelier"}
            {quote.enquiry && (
              <>
                {" "}
                · Linked to{" "}
                <Link
                  href={`/admin/enquiries/${quote.enquiry.id}`}
                  className="text-forest underline hover:text-gold"
                >
                  Guest Enquiry ({quote.enquiry.customerName})
                </Link>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/admin/quotes/${quote.id}/pdf`}
            download
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-forest px-6 text-xs font-semibold text-white hover:bg-forest/90 transition shadow-sm"
          >
            <Download size={15} aria-hidden="true" /> Download PDF Quote
          </a>
        </div>
      </header>

      {/* Feedback Messages */}
      {message && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          {message}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {errorMessage}
        </div>
      )}

      {/* Sharing & Status Lifecycle Toolbar */}
      {canMutate && (
        <section className="rounded-xl border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl text-forest">Quotation management & sharing</h2>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {/* Status updates */}
            <div className="rounded-lg border border-charcoal/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
                Update Quotation Lifecycle
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy || quote.status === "SENT"}
                  onClick={() => updateStatus("SENT")}
                  className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-medium text-sky-900 hover:bg-sky-100 disabled:opacity-40 cursor-pointer"
                >
                  Mark as Sent
                </button>
                <button
                  type="button"
                  disabled={busy || quote.status === "ACCEPTED"}
                  onClick={() => updateStatus("ACCEPTED")}
                  className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer"
                >
                  Mark as Accepted
                </button>
                <button
                  type="button"
                  disabled={busy || quote.status === "REJECTED"}
                  onClick={() => updateStatus("REJECTED")}
                  className="rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-900 hover:bg-rose-100 disabled:opacity-40 cursor-pointer"
                >
                  Mark as Rejected
                </button>
                <button
                  type="button"
                  disabled={busy || quote.status === "EXPIRED"}
                  onClick={() => updateStatus("EXPIRED")}
                  className="rounded-full border border-charcoal/20 bg-charcoal/5 px-4 py-2 text-xs font-medium text-charcoal/70 hover:bg-charcoal/10 disabled:opacity-40 cursor-pointer"
                >
                  Mark as Expired
                </button>
              </div>
            </div>

            {/* Secure Public Link */}
            <div className="rounded-lg border border-charcoal/10 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
                  Guest Secure Link (Cryptographic Token)
                </p>
                {quote.publicToken && !quote.isTokenRevoked ? (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                    <CheckCircle2 size={12} aria-hidden="true" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-charcoal/40">
                    <Lock size={12} aria-hidden="true" /> Inactive
                  </span>
                )}
              </div>

              {quote.publicToken && !quote.isTokenRevoked ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2 rounded border border-charcoal/15 bg-ivory p-2 text-xs font-mono text-charcoal/80 overflow-x-auto">
                    <span className="truncate">{publicLink}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={copyLinkToClipboard}
                      className="inline-flex items-center gap-1 rounded bg-forest/10 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/20 cursor-pointer"
                    >
                      {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                      {copied ? "Copied!" : "Copy link"}
                    </button>

                    <Link
                      href={`/quotes/${quote.publicToken}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-charcoal/80 hover:bg-white cursor-pointer"
                    >
                      <ExternalLink size={13} aria-hidden="true" /> Open preview
                    </Link>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => manageLink("revoke")}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      <XCircle size={13} aria-hidden="true" /> Revoke link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-charcoal/60">
                    No active public link. Create an unguessable token link to share with the guest.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => manageLink("create")}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-deep-green hover:bg-forest hover:text-white cursor-pointer transition"
                  >
                    <ExternalLink size={13} aria-hidden="true" /> Generate guest share link
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main Details Grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Guest & Expedition Overview */}
        <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest">Guest & expedition profile</h2>
          <dl className="mt-6 divide-y divide-charcoal/10 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Guest Name:</dt>
              <dd className="font-medium text-forest">{quote.customerName}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Email Address:</dt>
              <dd className="font-medium text-forest">{quote.customerEmail}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Phone Contact:</dt>
              <dd className="font-medium text-forest">{quote.customerPhone || "Not specified"}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Adult Travellers:</dt>
              <dd className="font-medium text-forest">{quote.adults} Adults</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Child Travellers:</dt>
              <dd className="font-medium text-forest">
                {quote.children > 0 ? `${quote.children} Children (Unpriced in indicative quote)` : "0 Children"}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Travel Window:</dt>
              <dd className="font-medium text-forest">
                {quote.startDate
                  ? `${quote.startDate.slice(0, 10)}${quote.endDate ? ` to ${quote.endDate.slice(0, 10)}` : ""}`
                  : "Flexible"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Journey Details */}
        <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest">Journey specification</h2>
          <dl className="mt-6 divide-y divide-charcoal/10 text-sm">
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Journey Title:</dt>
              <dd className="font-medium text-forest text-right">{quote.package.title}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Destination & Duration:</dt>
              <dd className="font-medium text-forest">
                {quote.package.destination} · {quote.durationDays} Days
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Lodge Category:</dt>
              <dd className="font-medium text-forest">{quote.package.hotelCategory}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Matched Season:</dt>
              <dd className="font-medium text-forest">
                {quote.seasonalPrice?.seasonName || "Standard Season"}
              </dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-charcoal/60">Price Basis:</dt>
              <dd className="font-medium text-forest text-right text-xs">
                {quote.pricingBasis}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Indicative Financial Calculation Card */}
      <section className="border border-forest/20 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Transparent pricing breakdown</h2>
        <p className="mt-1 text-xs text-charcoal/60">
          Sourced strictly from published database seasonal tariffs without artificial invention or AI calculation.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-charcoal/15">
          <table className="w-full text-left text-sm">
            <thead className="bg-forest text-white text-xs uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold">Component</th>
                <th className="p-4 font-semibold">Price Basis</th>
                <th className="p-4 font-semibold">Tariff Rate</th>
                <th className="p-4 font-semibold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal/10 bg-ivory/30">
              <tr>
                <td className="p-4 font-medium text-forest">
                  Adult Package Tariff ({quote.adults} Guest{quote.adults > 1 ? "s" : ""})
                </td>
                <td className="p-4 text-xs text-charcoal/60">{quote.pricingBasis}</td>
                <td className="p-4 text-charcoal/80">
                  {quote.currency} {Number(quote.basePriceAmount).toLocaleString("en-IN")}
                </td>
                <td className="p-4 text-right font-semibold text-forest">
                  {quote.currency} {Number(quote.calculatedTotal).toLocaleString("en-IN")}
                </td>
              </tr>

              <tr>
                <td className="p-4 font-medium text-forest">
                  Child Travellers ({quote.children})
                </td>
                <td className="p-4 text-xs text-charcoal/60 italic">
                  {quote.children > 0
                    ? "Unpriced — subject to room share & hotel policy"
                    : "No children configured"}
                </td>
                <td className="p-4 text-xs text-charcoal/50 italic">Unpriced</td>
                <td className="p-4 text-right text-xs text-charcoal/50 italic">--</td>
              </tr>

              <tr className="bg-forest/5 font-semibold text-forest">
                <td colSpan={3} className="p-4 text-base">
                  Indicative Total (Excludes Unconfirmed GST):
                </td>
                <td className="p-4 text-right font-display text-xl text-forest">
                  {quote.currency} {Number(quote.calculatedTotal).toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Governance Disclaimers */}
        <div className="mt-6 rounded-lg border border-gold/40 bg-gold/10 p-5 text-xs text-deep-green leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldCheck size={18} className="mt-0.5 text-forest shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-forest">Governance and Price Integrity Disclaimers:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>GST treatment is subject to confirmation upon final reservation billing.</li>
                <li>Child travellers are not assumed to receive adult rates or flat discounts.</li>
                <li>This quotation is indicative and subject to lodge availability at time of formal booking.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Itinerary Schedule Preview */}
      {quote.package.itineraryDays && quote.package.itineraryDays.length > 0 && (
        <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-2xl text-forest">Itinerary highlights</h2>
          <div className="mt-5 divide-y divide-charcoal/10">
            {quote.package.itineraryDays.map((day) => (
              <div key={day.dayNumber} className="py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Day {day.dayNumber}
                </p>
                <h3 className="mt-1 font-medium text-forest">{day.title}</h3>
                <p className="mt-1 text-sm text-charcoal/70 leading-relaxed">{day.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Consultant Notes */}
      {quote.notes && (
        <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
          <h2 className="font-display text-xl text-forest">Consultant notes for guest</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal/80 bg-ivory p-4 rounded-lg border border-charcoal/10">
            {quote.notes}
          </p>
        </section>
      )}
    </div>
  );
}
