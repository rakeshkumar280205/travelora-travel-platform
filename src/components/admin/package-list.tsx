"use client";

import Link from "next/link";
import { Copy, Pencil, Search } from "lucide-react";
import { useMemo, useState } from "react";

type PackageRow = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  hotelCategory: string;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: string;
};

export function PackageList({
  packages,
  canMutate,
}: {
  packages: PackageRow[];
  canMutate: boolean;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | "DRAFT" | "PUBLISHED">("ALL");
  const [message, setMessage] = useState("");
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const filtered = useMemo(() => packages.filter((packageRecord) => {
    const matchesQuery = `${packageRecord.title} ${packageRecord.slug} ${packageRecord.destination}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesQuery && (status === "ALL" || packageRecord.status === status);
  }), [packages, query, status]);

  async function duplicatePackage(id: string) {
    setDuplicating(id);
    setMessage("");
    const response = await fetch(`/api/admin/packages/${id}/duplicate`, { method: "POST" });
    if (!response.ok) {
      setMessage("The package could not be duplicated.");
      setDuplicating(null);
      return;
    }
    window.location.reload();
  }

  return (
    <section className="border border-charcoal/10 bg-white">
      <div className="flex flex-col gap-4 border-b border-charcoal/10 p-5 lg:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search packages</span>
          <Search size={17} className="absolute left-4 top-3.5 text-charcoal/40" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, code or destination"
            className="w-full border border-charcoal/15 bg-ivory py-3 pl-11 pr-4 text-sm outline-none focus:border-gold"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="w-full border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none focus:border-gold sm:w-44">
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </label>
      </div>
      {message && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800">{message}</p>}
      {filtered.length > 0 ? (
        <div className="divide-y divide-charcoal/10">
          {filtered.map((packageRecord) => (
            <article id={packageRecord.id} key={packageRecord.id} className="flex flex-col gap-4 px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="truncate font-medium text-forest">{packageRecord.title}</h2>
                <p className="mt-1 text-xs text-charcoal/50">{packageRecord.slug}</p>
                <p className="mt-2 text-sm text-charcoal/55">{packageRecord.destination} · {packageRecord.durationDays} days · {packageRecord.hotelCategory}</p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <span className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${packageRecord.status === "PUBLISHED" ? "bg-forest/10 text-forest" : "bg-gold/20 text-deep-green"}`}>
                  {packageRecord.status.toLowerCase()}
                </span>
                <span className="text-xs text-charcoal/45">Updated {formatDate(packageRecord.updatedAt)}</span>
                {canMutate && (
                  <>
                    <Link href={`/admin/packages/${packageRecord.id}/edit`} className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-gold">
                      <Pencil size={15} /> Edit
                    </Link>
                    <Link href={`/admin/packages/${packageRecord.id}/preview`} className="text-sm font-medium text-forest hover:text-gold">
                      Preview
                    </Link>
                    <button type="button" disabled={duplicating === packageRecord.id} onClick={() => duplicatePackage(packageRecord.id)} className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-gold disabled:opacity-50">
                      <Copy size={15} /> {duplicating === packageRecord.id ? "Copying..." : "Duplicate"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <h2 className="font-display text-2xl text-forest">{packages.length === 0 ? "No packages yet" : "No matching packages"}</h2>
          <p className="mt-3 text-sm text-charcoal/55">{packages.length === 0 ? "Create your first journey to see it here." : "Try a different search or status filter."}</p>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
