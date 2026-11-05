import { notFound, redirect } from "next/navigation";
import { getStaffSession } from "@/server/services/authorization";
import { getQuoteDetailForStaff } from "@/server/services/quote-service";
import { QuoteDetailView } from "@/components/admin/quote-detail-view";

export const instant = false;

export default async function AdminQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/signin");

  const { id } = await params;

  let quoteRecord;
  try {
    quoteRecord = await getQuoteDetailForStaff(
      id,
      session.user.id,
      session.user.role
    );
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      redirect("/admin/quotes");
    }
    notFound();
  }

  if (!quoteRecord) notFound();

  return (
    <QuoteDetailView
      quote={{
        id: quoteRecord.id,
        quoteNumber: quoteRecord.quoteNumber,
        status: quoteRecord.status,
        customerName: quoteRecord.customerName,
        customerEmail: quoteRecord.customerEmail,
        customerPhone: quoteRecord.customerPhone,
        startDate: quoteRecord.startDate?.toISOString() ?? null,
        endDate: quoteRecord.endDate?.toISOString() ?? null,
        durationDays: quoteRecord.durationDays,
        adults: quoteRecord.adults,
        children: quoteRecord.children,
        basePriceAmount: String(quoteRecord.basePriceAmount),
        currency: quoteRecord.currency,
        pricingBasis: quoteRecord.pricingBasis,
        calculatedTotal: String(quoteRecord.calculatedTotal),
        notes: quoteRecord.notes,
        publicToken: quoteRecord.publicToken,
        tokenExpiresAt: quoteRecord.tokenExpiresAt?.toISOString() ?? null,
        isTokenRevoked: quoteRecord.isTokenRevoked,
        createdAt: quoteRecord.createdAt.toISOString(),
        sentAt: quoteRecord.sentAt?.toISOString() ?? null,
        acceptedAt: quoteRecord.acceptedAt?.toISOString() ?? null,
        rejectedAt: quoteRecord.rejectedAt?.toISOString() ?? null,
        package: quoteRecord.package,
        seasonalPrice: quoteRecord.seasonalPrice
          ? {
              seasonName: quoteRecord.seasonalPrice.seasonName,
              startDate: quoteRecord.seasonalPrice.startDate.toISOString(),
              endDate: quoteRecord.seasonalPrice.endDate.toISOString(),
              amount: String(quoteRecord.seasonalPrice.amount),
              currency: quoteRecord.seasonalPrice.currency,
              pricingBasis: quoteRecord.seasonalPrice.pricingBasis,
            }
          : null,
        createdBy: quoteRecord.createdBy,
        enquiry: quoteRecord.enquiry,
        snapshot: quoteRecord.snapshot as Record<string, unknown> | null,
      }}
      canMutate={["ADMIN", "CONSULTANT", "EDITOR"].includes(session.user.role)}
    />
  );
}
