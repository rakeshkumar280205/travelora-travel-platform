"use client";

import { ResilientImage } from "@/components/ui/resilient-image";
import Link from "next/link";
import { ArrowUpRight, ChevronDown, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { DiscoveryPackage } from "@/features/packages/package-types";
import {
  formatAmount,
  formatPrice,
  getLowestPrice,
  getPackageImage,
  getPackageFallbackImage,
} from "@/features/packages/package-types";

type PackageDiscoveryProps = {
  packages: DiscoveryPackage[];
};

type SortOption = "featured" | "duration" | "price";

export function PackageDiscovery({ packages }: PackageDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [destination, setDestination] = useState("all");
  const [duration, setDuration] = useState("all");
  const [hotelCategory, setHotelCategory] = useState("all");
  const [season, setSeason] = useState("all");
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const options = useMemo(
    () => ({
      destinations: [...new Set(packages.map((item) => item.destination))].sort(),
      durations: [...new Set(packages.map((item) => item.durationDays))].sort(
        (a, b) => a - b
      ),
      hotels: [...new Set(packages.map((item) => item.hotelCategory))].sort(),
      seasons: [
        ...new Set(
          packages.flatMap((item) =>
            (item.seasonalPrices ?? []).map((price) => price.seasonName)
          )
        ),
      ].sort(),
    }),
    [packages]
  );

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = packages.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.destination.toLowerCase().includes(normalizedQuery);
      const matchesDestination =
        destination === "all" || item.destination === destination;
      const matchesDuration =
        duration === "all" || item.durationDays === Number(duration);
      const matchesHotel =
        hotelCategory === "all" || item.hotelCategory === hotelCategory;
      const matchesSeason =
        season === "all" ||
        item.seasonalPrices.some((price) => price.seasonName === season);

      return (
        matchesQuery &&
        matchesDestination &&
        matchesDuration &&
        matchesHotel &&
        matchesSeason
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "duration") return a.durationDays - b.durationDays;
      if (sort === "price") {
        const priceA = getLowestPrice(a);
        const priceB = getLowestPrice(b);
        if (priceA === null && priceB === null) return 0;
        if (priceA === null) return 1;
        if (priceB === null) return -1;
        return priceA - priceB;
      }
      return packages.indexOf(a) - packages.indexOf(b);
    });
  }, [
    destination,
    duration,
    hotelCategory,
    packages,
    query,
    season,
    sort,
  ]);

  const clearFilters = () => {
    setQuery("");
    setDestination("all");
    setDuration("all");
    setHotelCategory("all");
    setSeason("all");
    setSort("featured");
  };

  const hasFilters =
    query ||
    destination !== "all" ||
    duration !== "all" ||
    hotelCategory !== "all" ||
    season !== "all";

  return (
    <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
      <div className="lg:hidden">
        <button
          type="button"
          className="flex min-h-12 w-full items-center justify-between border border-charcoal/15 bg-white px-4 text-sm font-medium text-forest"
          aria-expanded={filtersOpen}
          aria-controls="package-filters"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <span className="inline-flex items-center gap-2">
            <Filter size={16} aria-hidden="true" /> Filter journeys
          </span>
          <ChevronDown
            size={18}
            className={filtersOpen ? "rotate-180 transition-transform" : "transition-transform"}
            aria-hidden="true"
          />
        </button>
      </div>

      <aside
        id="package-filters"
        className={`${filtersOpen ? "block" : "hidden"} space-y-7 lg:block`}
        aria-label="Filter journeys"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-forest">Refine your search</h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-charcoal/60 underline underline-offset-4 hover:text-forest"
            >
              Clear all
            </button>
          )}
        </div>
        <div>
          <label htmlFor="package-search-input" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-charcoal/50">
            Search
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3.5 text-charcoal/45" aria-hidden="true" />
            <input
              id="package-search-input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Title or destination"
              className="h-11 w-full border border-charcoal/15 bg-white pl-10 pr-3 text-sm outline-none ring-gold transition focus:ring-2 focus:border-forest"
            />
          </div>
        </div>
        <FilterSelect label="Destination" value={destination} onChange={setDestination} options={options.destinations} />
        <FilterSelect
          label="Duration"
          value={duration}
          onChange={setDuration}
          options={options.durations.map((item) => String(item))}
          labels={options.durations.map((item) => `${item} days`)}
        />
        <FilterSelect label="Hotel category" value={hotelCategory} onChange={setHotelCategory} options={options.hotels} />
        {options.seasons.length > 0 && (
          <FilterSelect label="Available season" value={season} onChange={setSeason} options={options.seasons} />
        )}
      </aside>

      <section aria-labelledby="results-heading">
        <div className="mb-7 flex flex-col gap-4 border-b border-charcoal/15 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p id="results-heading" className="text-sm text-charcoal/60" aria-live="polite">
            <span className="font-medium text-forest">{filteredPackages.length}</span>{" "}
            {filteredPackages.length === 1 ? "journey" : "journeys"} found
          </p>
          <div className="flex items-center gap-3 text-sm text-charcoal/60">
            <label htmlFor="package-sort-select">Sort by</label>
            <select
              id="package-sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="border-0 bg-transparent py-2 font-medium text-forest outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <option value="featured">Featured</option>
              <option value="duration">Duration</option>
              <option value="price">Price</option>
            </select>
          </div>
        </div>

        {filteredPackages.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPackages.map((item) => (
              <DiscoveryCard key={item.id} packageRecord={item} />
            ))}
          </div>
        ) : (
          <div className="border border-charcoal/15 bg-white px-6 py-16 text-center">
            <p className="font-display text-3xl text-forest">No journeys found</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-charcoal/60">
              Try a different destination, duration or search term.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-forest underline decoration-gold underline-offset-8"
            >
              Clear search and filters <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  labels = options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-charcoal/50">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full border border-charcoal/15 bg-white px-3 text-sm text-forest outline-none ring-gold transition focus:ring-2 focus:border-forest"
      >
        <option value="all">
          All {label === "Hotel category" ? "hotel categories" : `${label.toLowerCase()}s`}
        </option>
        {options.map((option, index) => (
          <option key={option} value={option}>
            {labels[index]}
          </option>
        ))}
      </select>
    </div>
  );
}

function DiscoveryCard({ packageRecord }: { packageRecord: DiscoveryPackage }) {
  const price = formatPrice(packageRecord);
  const seasonalPrices = packageRecord.seasonalPrices.filter((seasonalPrice) => {
    const amount = Number(seasonalPrice.amount);
    return Number.isFinite(amount) && amount > 0;
  });

  return (
    <article className="group overflow-hidden border border-charcoal/10 bg-white">
      <Link
        href={`/packages/${packageRecord.slug}`}
        aria-label={`View journey: ${packageRecord.title}`}
        className="block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <ResilientImage
            src={getPackageImage(packageRecord.destination)}
            fallbackSrc={getPackageFallbackImage(packageRecord.destination)}
            alt={`${packageRecord.destination} landscape`}
            fill
            sizes="(max-width: 768px) 100vw, 42vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 bg-ivory/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-forest">
            {packageRecord.category}
          </span>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-gold">
            <span>{packageRecord.destination}</span>
            <span>{packageRecord.durationDays} days</span>
          </div>
          <h3 className="font-display mt-4 text-3xl leading-tight text-forest">
            {packageRecord.title}
          </h3>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-charcoal/60">
            {packageRecord.description}
          </p>
          <div className="mt-6 flex items-end justify-between gap-4 border-t border-charcoal/10 pt-5">
            <div>
              <p className="text-xs text-charcoal/50">{packageRecord.hotelCategory} stays</p>
              {price && (
                <p className="mt-1 text-sm font-medium text-forest">
                  From {price} <span className="font-normal text-charcoal/50">/ person</span>
                </p>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-forest">
              View journey <ArrowUpRight size={16} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-5 border-t border-charcoal/10 pt-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-charcoal/45">
              Available seasonal pricing
            </p>
            {seasonalPrices.length > 0 ? (
              <ul className="mt-2 space-y-1.5 text-xs text-charcoal/60">
                {seasonalPrices.map((seasonalPrice) => (
                  <li key={seasonalPrice.id} className="flex justify-between gap-3">
                    <span>{seasonalPrice.seasonName}</span>
                    <span className="font-medium text-forest">
                      {formatAmount(
                        Number(seasonalPrice.amount),
                        seasonalPrice.currency
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-charcoal/50">Price on request</p>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
