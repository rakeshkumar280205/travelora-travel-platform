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
    <section className="border border-charcoal/10 bg-white" aria-labelledby="package-list-heading">
      <h2 id="package-list-heading" className="sr-only">Package list</h2>
      <div className="flex flex-col gap-4 border-b border-charcoal/10 p-5 lg:flex-row">
        <div className="relative flex-1">
          <label htmlFor="package-admin-search" className="sr-only">Search packages</label>
          <Search size={17} className="absolute left-4 top-3.5 text-charcoal/40" aria-hidden="true" />
          <input
            id="package-admin-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, code or destination"
            className="w-full border border-charcoal/15 bg-ivory py-3 pl-11 pr-4 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          />
        </div>
        <div>
          <label htmlFor="package-admin-status-filter" className="sr-only">Filter by status</label>
          <select
            id="package-admin-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="w-full border border-charcoal/15 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40 sm:w-44"
          >
            <option value="ALL">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>
      {message && (
        <div role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800">
          {message}
        </div>
      )}
      {filtered.length > 0 ? (
        <div className="divide-y divide-charcoal/10">
          {filtered.map((packageRecord) => (
            <article id={packageRecord.id} key={packageRecord.id} className="flex flex-col gap-4 px-5 py-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h3 className="truncate font-medium text-forest text-base sm:text-lg">{packageRecord.title}</h3>
                <p className="mt-1 text-xs text-charcoal/50">{packageRecord.slug}</p>
                <p className="mt-2 text-sm text-charcoal/60">{packageRecord.destination} · {packageRecord.durationDays} days · {packageRecord.hotelCategory}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${packageRecord.status === "PUBLISHED" ? "bg-forest/10 text-forest" : "bg-gold/20 text-deep-green"}`}>
                  {packageRecord.status.toLowerCase()}
                </span>
                <span className="text-xs text-charcoal/50">Updated {formatDate(packageRecord.updatedAt)}</span>
                {canMutate && (
                  <>
                    <Link
                      href={`/admin/packages/${packageRecord.id}/edit`}
                      aria-label={`Edit ${packageRecord.title}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded px-1.5 py-1"
                    >
                      <Pencil size={15} aria-hidden="true" /> Edit
                    </Link>
                    <Link
                      href={`/admin/packages/${packageRecord.id}/preview`}
                      aria-label={`Preview ${packageRecord.title}`}
                      className="text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded px-1.5 py-1"
                    >
                      Preview
                    </Link>
                    <button
                      type="button"
                      disabled={duplicating === packageRecord.id}
                      onClick={() => duplicatePackage(packageRecord.id)}
                      aria-label={`Duplicate ${packageRecord.title}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded px-1.5 py-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Copy size={15} aria-hidden="true" /> {duplicating === packageRecord.id ? "Copying..." : "Duplicate"}
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-6 py-14 text-center">
          <p className="font-display text-2xl text-forest">{packages.length === 0 ? "No packages yet" : "No matching packages"}</p>
          <p className="mt-3 text-sm text-charcoal/60">{packages.length === 0 ? "Create your first journey to see it here." : "Try a different search or status filter."}</p>
        </div>
      )}
    </section>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
