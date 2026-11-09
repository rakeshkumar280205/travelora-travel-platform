"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { RotateCcw, Search } from "lucide-react";

export type EnquiryFiltersProps = {
  initialSearch?: string;
  initialStatus?: string;
  initialPackageId?: string;
  initialAssignedConsultantId?: string;
  packages: Array<{ id: string; title: string }>;
  consultants: Array<{ id: string; name: string }>;
  isAdmin: boolean;
};

const STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESPONDED",
  "CONVERTED",
  "CLOSED",
] as const;

export function EnquiryFilters({
  initialSearch = "",
  initialStatus = "",
  initialPackageId = "",
  initialAssignedConsultantId = "",
  packages,
  consultants,
  isAdmin,
}: EnquiryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [prevInitialSearch, setPrevInitialSearch] = useState(initialSearch);

  // Synchronize search input if initialSearch prop changes externally (e.g. on navigation or reset)
  if (initialSearch !== prevInitialSearch) {
    setPrevInitialSearch(initialSearch);
    setSearch(initialSearch);
  }

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const applyFilters = useCallback(
    (overrides: Partial<{ search: string; status: string; packageId: string; assignedConsultantId: string }>) => {
      const s = (overrides.search !== undefined ? overrides.search : search).trim();
      const st = overrides.status !== undefined ? overrides.status : initialStatus;
      const pkg = overrides.packageId !== undefined ? overrides.packageId : initialPackageId;
      const c = overrides.assignedConsultantId !== undefined ? overrides.assignedConsultantId : initialAssignedConsultantId;

      const params = new URLSearchParams();
      if (s) params.set("search", s);
      if (st) params.set("status", st);
      if (pkg) params.set("packageId", pkg);
      if (c) params.set("assignedConsultantId", c);

      // Reset to page 1 by omitting the "page" param

      const queryStr = params.toString();
      const targetUrl = queryStr ? `${pathname}?${queryStr}` : pathname;

      startTransition(() => {
        router.replace(targetUrl, { scroll: false });
      });
    },
    [search, initialStatus, initialPackageId, initialAssignedConsultantId, pathname, router]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      applyFilters({ search: value });
    }, 300);
  };

  const handleStatusChange = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters({ status: value });
  };

  const handlePackageChange = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters({ packageId: value });
  };

  const handleConsultantChange = (value: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    applyFilters({ assignedConsultantId: value });
  };

  const hasActiveFilters = Boolean(
    search.trim() || initialStatus || initialPackageId || initialAssignedConsultantId
  );

  const handleReset = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setSearch("");
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  };

  return (
    <div className="border border-charcoal/10 bg-white p-5" aria-label="Enquiry filters">
      <div className={`grid gap-3 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {/* Search Input */}
        <div className="relative">
          <label className="sr-only" htmlFor="enquiry-search">
            Search enquiries
          </label>
          <Search
            size={16}
            className="absolute left-3.5 top-3.5 text-charcoal/40"
            aria-hidden="true"
          />
          <input
            id="enquiry-search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search name, email or destination"
            className="min-h-11 w-full rounded-lg border border-charcoal/15 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <label className="sr-only" htmlFor="enquiry-status-filter">
            Filter by status
          </label>
          <select
            id="enquiry-status-filter"
            value={initialStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Filter by status"
            className="min-h-11 w-full rounded-lg border border-charcoal/15 bg-white px-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          >
            <option value="">All statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>
                {st.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Package Dropdown */}
        <div>
          <label className="sr-only" htmlFor="enquiry-package-filter">
            Filter by package
          </label>
          <select
            id="enquiry-package-filter"
            value={initialPackageId}
            onChange={(e) => handlePackageChange(e.target.value)}
            aria-label="Filter by package"
            className="min-h-11 w-full rounded-lg border border-charcoal/15 bg-white px-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
          >
            <option value="">All packages</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.title}
              </option>
            ))}
          </select>
        </div>

        {/* Consultant Dropdown (if admin) */}
        {isAdmin && (
          <div>
            <label className="sr-only" htmlFor="enquiry-consultant-filter">
              Filter by consultant
            </label>
            <select
              id="enquiry-consultant-filter"
              value={initialAssignedConsultantId}
              onChange={(e) => handleConsultantChange(e.target.value)}
              aria-label="Filter by consultant"
              className="min-h-11 w-full rounded-lg border border-charcoal/15 bg-white px-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
            >
              <option value="">All consultants</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dynamic Filter State & Reset Action */}
      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between border-t border-charcoal/10 pt-3 text-xs">
          <p className="text-charcoal/55">
            Active filters applied {isPending && <span className="text-gold font-medium">· Updating...</span>}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 font-medium text-forest hover:text-gold transition cursor-pointer"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
