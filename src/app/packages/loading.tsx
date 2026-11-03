export default function Loading() {
  return (
    <main className="min-h-screen bg-ivory px-6 pb-24 pt-36 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-3 w-40 rounded bg-charcoal/10" />
        <div className="mt-6 h-20 max-w-2xl rounded bg-charcoal/10" />
        <div className="mt-16 grid gap-10 lg:grid-cols-[250px_1fr]">
          <div className="h-96 rounded bg-charcoal/10" />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-[500px] rounded bg-charcoal/10" />
            <div className="h-[500px] rounded bg-charcoal/10" />
          </div>
        </div>
      </div>
    </main>
  );
}
