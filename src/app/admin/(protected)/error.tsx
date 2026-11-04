"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="border border-charcoal/10 bg-white px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Something went wrong</p>
      <h1 className="font-display mt-3 text-4xl text-forest">The studio is unavailable.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">
        We could not load this workspace. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-7 rounded-full bg-deep-green px-6 py-3 text-sm font-medium text-white hover:bg-forest"
      >
        Try again
      </button>
    </div>
  );
}
