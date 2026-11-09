import Link from "next/link";
import { redirect } from "next/navigation";

import { EnquiryFilters } from "@/components/admin/enquiry-filters";
import { enquiryListQuerySchema } from "@/lib/validation/admin-enquiry-schemas";
import { getStaffSession } from "@/server/services/authorization";
import { getEnquiryConsultants, getEnquiryList } from "@/server/services/enquiry-admin-service";
import { getAdminPackages } from "@/server/services/package-service";

export const instant = false;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnquiriesPage({ searchParams }: Props) {
  const session = await getStaffSession();
  if (!session) redirect("/admin/signin");
  if (session.user.role === "EDITOR") return <AccessDenied />;

  const raw = await searchParams;
  const query = enquiryListQuerySchema.parse({
    page: typeof raw.page === "string" ? raw.page : undefined,
    pageSize: typeof raw.pageSize === "string" ? raw.pageSize : undefined,
    search: typeof raw.search === "string" ? raw.search : undefined,
    status: typeof raw.status === "string" && raw.status ? raw.status : undefined,
    packageId: typeof raw.packageId === "string" && raw.packageId ? raw.packageId : undefined,
    assignedConsultantId: typeof raw.assignedConsultantId === "string" && raw.assignedConsultantId ? raw.assignedConsultantId : undefined,
  });
  const result = await getEnquiryList(
    query,
    session.user.role === "CONSULTANT" ? session.user.id : undefined,
  );
  const [packages, consultants] = await Promise.all([
    getAdminPackages(),
    session.user.role === "ADMIN" ? getEnquiryConsultants() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Client relationships</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Enquiries</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Review incoming travel requirements and keep every conversation moving.
        </p>
      </header>
      <EnquiryFilters
        initialSearch={query.search}
        initialStatus={query.status}
        initialPackageId={query.packageId}
        initialAssignedConsultantId={query.assignedConsultantId}
        packages={packages.map((p) => ({ id: p.id, title: p.title }))}
        consultants={consultants.map((c) => ({ id: c.id, name: c.name }))}
        isAdmin={session.user.role === "ADMIN"}
      />
      <section className="overflow-hidden border border-charcoal/10 bg-white">
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-5">
          <div><p className="text-xs uppercase tracking-[0.2em] text-gold">Inbox</p><h2 className="font-display mt-2 text-2xl text-forest">{result.total} enquiries</h2></div>
        </div>
        {result.items.length === 0 ? (
          <div className="px-6 py-16 text-center"><p className="font-display text-2xl text-forest">No enquiries found</p><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-charcoal/55">New public travel enquiries will appear here.</p></div>
        ) : (
          <div className="divide-y divide-charcoal/10">
            {result.items.map((enquiry) => (
              <Link key={enquiry.id} href={`/admin/enquiries/${enquiry.id}`} className="grid gap-4 px-6 py-5 transition-colors hover:bg-ivory sm:grid-cols-[1.3fr_1fr_auto] sm:items-center">
                <div><h3 className="font-medium text-forest">{enquiry.customerName}</h3><p className="mt-1 text-sm text-charcoal/55">{enquiry.email} · {enquiry.destination}</p></div>
                <div><p className="text-sm text-charcoal/65">{enquiry.package?.title ?? "General enquiry"}</p><p className="mt-1 text-xs text-charcoal/45">{enquiry.adults} adults{enquiry.children ? ` · ${enquiry.children} children` : ""}</p></div>
                <StatusBadge status={enquiry.status} />
              </Link>
            ))}
          </div>
        )}
        {Math.ceil(result.total / query.pageSize) > 1 && <div className="flex items-center justify-between border-t border-charcoal/10 px-6 py-4 text-sm"><span className="text-charcoal/55">Page {query.page} of {Math.ceil(result.total / query.pageSize)}</span><div className="flex gap-2">{query.page > 1 && <PaginationLink page={query.page - 1} query={query} label="Previous" />}{query.page < Math.ceil(result.total / query.pageSize) && <PaginationLink page={query.page + 1} query={query} label="Next" />}</div></div>}
      </section>
    </div>
  );
}

function PaginationLink({ page, query, label }: { page: number; query: { search?: string; status?: string; packageId?: string; assignedConsultantId?: string }; label: string }) {
  const params = new URLSearchParams({ page: String(page) });
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.packageId) params.set("packageId", query.packageId);
  if (query.assignedConsultantId) params.set("assignedConsultantId", query.assignedConsultantId);
  return <Link href={`/admin/enquiries?${params}`} className="rounded-full border border-charcoal/15 px-4 py-2 text-xs text-forest hover:border-gold">{label}</Link>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className="inline-flex w-fit rounded-full bg-gold/20 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-deep-green">{status.replaceAll("_", " ").toLowerCase()}</span>;
}

function AccessDenied() {
  return <div className="border border-charcoal/10 bg-white px-6 py-16 text-center"><h1 className="font-display text-4xl text-forest">Enquiries are restricted</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">Only administrators and assigned consultants can access customer enquiries.</p></div>;
}
