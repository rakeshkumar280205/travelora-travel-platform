export function FeaturedJourneysSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2" aria-label="Loading journeys" role="status">
      {[1, 2].map((item) => (
        <div key={item} className="animate-pulse border-t border-charcoal/15 pt-6">
          <div className="h-3 w-24 rounded bg-charcoal/10" />
          <div className="mt-8 h-10 max-w-sm rounded bg-charcoal/10" />
          <div className="mt-3 h-10 max-w-md rounded bg-charcoal/10" />
          <div className="mt-8 h-4 w-32 rounded bg-charcoal/10" />
        </div>
      ))}
    </div>
  );
}
