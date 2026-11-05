export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest px-6 pb-20 pt-36 text-white sm:px-10 lg:px-16 animate-pulse">
        <div className="mx-auto max-w-7xl">
          <div className="h-4 w-32 rounded bg-white/20" />
          <div className="mt-4 h-12 w-3/4 max-w-2xl rounded bg-white/20" />
          <div className="mt-4 h-6 w-1/2 max-w-lg rounded bg-white/20" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex gap-2 border-b border-charcoal/10 pb-8">
          <div className="h-8 w-24 rounded-full bg-charcoal/10 animate-pulse" />
          <div className="h-8 w-28 rounded-full bg-charcoal/10 animate-pulse" />
          <div className="h-8 w-32 rounded-full bg-charcoal/10 animate-pulse" />
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white"
            >
              <div className="aspect-[16/10] w-full bg-charcoal/10 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-3 w-20 rounded bg-charcoal/10 animate-pulse" />
                <div className="h-6 w-3/4 rounded bg-charcoal/10 animate-pulse" />
                <div className="h-12 w-full rounded bg-charcoal/10 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
