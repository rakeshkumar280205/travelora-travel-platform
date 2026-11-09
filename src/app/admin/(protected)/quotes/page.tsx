import Link from "next/link";
import { getStaffSession } from "@/server/services/authorization";
import { getQuotesForStaff } from "@/server/services/quote-service";
import { QuoteList } from "@/components/admin/quote-list";

export const instant = false;

export default async function AdminQuotesPage() {
  const session = await getStaffSession();
  if (!session) return null;

  const quotes = await getQuotesForStaff(session.user.id, session.user.role);

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Commercial & Sales</p>
          <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">
            Client Quotations
          </h1>
          <p className="mt-4 text-sm leading-7 text-charcoal/60">
            Transparent travel quotes backed directly by published seasonal tariffs.
          </p>
        </div>

        <Link
          href="/admin/quotes/new"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-deep-green hover:bg-forest hover:text-white transition"
        >
          Create quotation
        </Link>
      </header>

      <QuoteList
        quotes={quotes.map((q) => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          status: q.status,
          customerName: q.customerName,
          customerEmail: q.customerEmail,
          packageTitle: q.package.title,
          destination: q.package.destination,
          durationDays: q.durationDays,
          startDate: q.startDate?.toISOString() ?? null,
          adults: q.adults,
          children: q.children,
          calculatedTotal: String(q.calculatedTotal),
          currency: q.currency,
          publicToken: q.publicToken,
          isTokenRevoked: q.isTokenRevoked,
          createdAt: q.createdAt.toISOString(),
          consultantName: q.createdBy?.name ?? null,
        }))}
      />
    </div>
  );
}
