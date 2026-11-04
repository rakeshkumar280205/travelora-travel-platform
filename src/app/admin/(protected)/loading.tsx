export default function AdminLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading admin dashboard">
      <div className="h-4 w-24 animate-pulse rounded bg-charcoal/10" />
      <div className="h-12 w-72 animate-pulse rounded bg-charcoal/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse border border-charcoal/10 bg-white" />
        ))}
      </div>
      <div className="h-72 animate-pulse border border-charcoal/10 bg-white" />
    </div>
  );
}
