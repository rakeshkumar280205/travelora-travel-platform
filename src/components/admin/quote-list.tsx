"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, ExternalLink, Eye, Plus, Search } from "lucide-react";

export type QuoteRow = {
  id: string;
  quoteNumber: string;
  status: "DRAFT" | "GENERATED" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  customerName: string;
  customerEmail: string;
  packageTitle: string;
  destination: string;
  durationDays: number;
  startDate?: string | null;
  adults: number;
  children: number;
  calculatedTotal: string;
  currency: string;
  publicToken?: string | null;
  isTokenRevoked: boolean;
  createdAt: string;
  consultantName?: string | null;
};

export function QuoteList({
  quotes,
  canCreate,
}: {
  quotes: QuoteRow[];
  canCreate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      const searchTarget = `${q.quoteNumber} ${q.customerName} ${q.customerEmail} ${q.packageTitle} ${q.destination}`.toLowerCase();
      const matchesQuery = searchTarget.includes(query.toLowerCase());
      const matchesStatus = status === "ALL" || q.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [quotes, query, status]);

  function getStatusBadgeStyle(qStatus: QuoteRow["status"]) {
    switch (qStatus) {
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
    <section className="border border-charcoal/10 bg-white" aria-labelledby="quote-list-heading">
      <h2 id="quote-list-heading" className="sr-only">Quotations list</h2>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 border-b border-charcoal/10 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <label htmlFor="quote-admin-search" className="sr-only">Search quotations</label>
          <Search size={17} className="absolute left-4 top-3.5 text-charcoal/40" aria-hidden="true" />
          <input
            id="quote-admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search quote reference, guest name, package or destination..."
            className="w-full border border-charcoal/15 bg-ivory py-3 pl-11 pr-4 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label htmlFor="quote-admin-status-filter" className="sr-only">Filter by status</label>
            <select
              id="quote-admin-status-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40 sm:w-44"
            >
              <option value="ALL">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="GENERATED">Generated</option>
              <option value="SENT">Sent</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>

          {canCreate && (
            <Link
              href="/admin/quotes/new"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-xs font-semibold text-deep-green hover:bg-forest hover:text-white transition"
            >
              <Plus size={15} aria-hidden="true" /> Create quote
            </Link>
          )}
        </div>
      </div>

      {/* Quote Items List */}
      {filtered.length > 0 ? (
        <div className="divide-y divide-charcoal/10">
          {filtered.map((quote) => (
            <article
              key={quote.id}
              className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between hover:bg-ivory/30 transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-forest">
                    {quote.quoteNumber}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${getStatusBadgeStyle(
                      quote.status
                    )}`}
                  >
                    {quote.status}
                  </span>
                  <span className="text-xs text-charcoal/50">
                    Created {formatDate(quote.createdAt)} · By {quote.consultantName || "Private Atelier"}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-medium text-forest sm:text-lg">
                  {quote.customerName}{" "}
                  <span className="text-xs font-normal text-charcoal/60">
                    ({quote.customerEmail})
                  </span>
                </h3>

                <p className="mt-1 text-xs text-charcoal/70">
                  {quote.packageTitle} · {quote.destination} ({quote.durationDays} Days)
                </p>

                <p className="mt-2 text-xs text-charcoal/60">
                  {quote.adults} adult(s){quote.children > 0 ? `, ${quote.children} children` : ""}{" "}
                  · Travel: {quote.startDate ? quote.startDate.slice(0, 10) : "Flexible window"}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-forest">
                    {quote.currency} {Number(quote.calculatedTotal).toLocaleString("en-IN")}
                  </p>
                  <p className="text-[11px] text-charcoal/50">Indicative adult subtotal</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/quotes/${quote.id}`}
                    aria-label={`View quote ${quote.quoteNumber}`}
                    className="inline-flex items-center gap-1 rounded border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/5 transition"
                  >
                    <Eye size={13} aria-hidden="true" /> Details
                  </Link>

                  <a
                    href={`/api/admin/quotes/${quote.id}/pdf`}
                    download
                    aria-label={`Download PDF for ${quote.quoteNumber}`}
                    className="inline-flex items-center gap-1 rounded bg-forest/10 px-3 py-1.5 text-xs font-medium text-forest hover:bg-forest/20 transition"
                  >
                    <Download size={13} aria-hidden="true" /> PDF
                  </a>

                  {quote.publicToken && !quote.isTokenRevoked && (
                    <Link
                      href={`/quotes/${quote.publicToken}`}
                      target="_blank"
                      aria-label={`Public link for ${quote.quoteNumber}`}
                      className="inline-flex items-center gap-1 rounded border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-deep-green hover:bg-gold/25 transition"
                    >
                      <ExternalLink size={13} aria-hidden="true" /> Guest Link
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <p className="font-display text-2xl text-forest">
            {quotes.length === 0 ? "No quotations generated yet" : "No matching quotations"}
          </p>
          <p className="mt-3 text-sm text-charcoal/60">
            {quotes.length === 0
              ? "Generate your first transparent client quote backed by seasonal package pricing."
              : "Try adjusting your search criteria or status filter."}
          </p>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
