export default function BlogPostLoading() {
  return (
    <div className="min-h-screen bg-ivory">
      <div className="bg-forest px-6 pb-16 pt-32 text-white sm:px-10 lg:px-16 animate-pulse">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-4 w-32 rounded bg-white/20" />
          <div className="h-6 w-24 rounded-full bg-white/20" />
          <div className="h-14 w-full rounded bg-white/20" />
          <div className="h-10 w-3/4 rounded bg-white/20" />
          <div className="h-6 w-1/2 rounded bg-white/20" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:px-16">
        <div className="mb-12 aspect-[16/9] w-full rounded-2xl bg-charcoal/10 animate-pulse" />
        <div className="space-y-4">
          <div className="h-5 w-full rounded bg-charcoal/10 animate-pulse" />
          <div className="h-5 w-11/12 rounded bg-charcoal/10 animate-pulse" />
          <div className="h-5 w-4/5 rounded bg-charcoal/10 animate-pulse" />
          <div className="h-32 w-full rounded bg-charcoal/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
