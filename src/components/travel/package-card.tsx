import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

type PackageCardProps = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  hotelCategory: string;
};

export function PackageCard({
  slug,
  title,
  destination,
  durationDays,
  description,
  hotelCategory,
}: PackageCardProps) {
  return (
    <article className="group flex h-full flex-col border-t border-charcoal/15 pt-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">
          {destination}
        </p>
        <span className="rounded-full border border-charcoal/15 px-3 py-1 text-[11px] text-charcoal/60">
          {durationDays} days
        </span>
      </div>
      <h3 className="font-display mt-8 max-w-sm text-3xl leading-tight text-forest">
        {title}
      </h3>
      <p className="mt-4 line-clamp-3 text-sm leading-6 text-charcoal/60">{description}</p>
      <div className="mt-8 flex items-center justify-between border-t border-charcoal/10 pt-4 text-xs text-charcoal/55">
        <span>{hotelCategory} stays</span>
        <Link
          href={`/packages/${slug}`}
          className="inline-flex items-center gap-2 font-medium text-forest transition-colors hover:text-gold"
        >
          View journey
          <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
