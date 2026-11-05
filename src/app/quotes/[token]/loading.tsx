export default function PublicQuoteLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest px-6 pb-20 pt-36 text-white sm:px-10 lg:px-16 animate-pulse">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-6 w-32 rounded-full bg-white/20" />
          <div className="h-12 w-3/4 rounded bg-white/20" />
          <div className="h-6 w-1/2 rounded bg-white/20" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:px-16 space-y-8">
        <div className="h-44 w-full rounded-2xl bg-charcoal/10 animate-pulse" />
        <div className="h-64 w-full rounded-2xl bg-charcoal/10 animate-pulse" />
        <div className="h-48 w-full rounded-2xl bg-charcoal/10 animate-pulse" />
      </div>
    </div>
  );
}
