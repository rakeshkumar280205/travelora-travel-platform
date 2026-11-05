import { redirect } from "next/navigation";
import { getStaffSession } from "@/server/services/authorization";
import { prisma } from "@/server/db/client";
import { QuoteForm } from "@/components/admin/quote-form";

export const instant = false;

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ enquiryId?: string }>;
}) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/signin");

  const { enquiryId } = await searchParams;

  // Retrieve published packages with seasonal prices
  const packages = await prisma.package.findMany({
    where: {
      status: "PUBLISHED",
    },
    include: {
      seasonalPrices: {
        orderBy: { startDate: "asc" },
      },
    },
    orderBy: { title: "asc" },
  });

  // Retrieve accessible enquiries
  const enquiryWhere = session.user.role === "CONSULTANT"
    ? { assignedConsultantId: session.user.id }
    : {};

  const enquiries = await prisma.enquiry.findMany({
    where: enquiryWhere,
    select: {
      id: true,
      customerName: true,
      email: true,
      phone: true,
      destination: true,
      travelMonth: true,
      startDate: true,
      durationDays: true,
      adults: true,
      children: true,
      packageId: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const packageOptions = packages.map((pkg) => ({
    id: pkg.id,
    title: pkg.title,
    destination: pkg.destination,
    durationDays: pkg.durationDays,
    category: pkg.category,
    seasonalPrices: pkg.seasonalPrices.map((sp) => ({
      id: sp.id,
      seasonName: sp.seasonName,
      startDate: sp.startDate.toISOString(),
      endDate: sp.endDate.toISOString(),
      amount: String(sp.amount),
      currency: sp.currency,
      pricingBasis: sp.pricingBasis,
    })),
  }));

  const enquiryOptions = enquiries.map((enq) => ({
    id: enq.id,
    customerName: enq.customerName,
    email: enq.email,
    phone: enq.phone,
    destination: enq.destination,
    travelMonth: enq.travelMonth,
    startDate: enq.startDate?.toISOString() ?? null,
    durationDays: enq.durationDays,
    adults: enq.adults,
    children: enq.children,
    packageId: enq.packageId,
  }));

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Quote Builder</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">
          Build Formal Quotation
        </h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Source package seasonal rates directly from the database and calculate transparent client quotes.
        </p>
      </header>

      <QuoteForm
        packages={packageOptions}
        enquiries={enquiryOptions}
        initialEnquiryId={enquiryId}
      />
    </div>
  );
}
