"use client";

import { useEffect } from "react";

export default function Error({ reset }: { reset: () => void }) {
  useEffect(() => {
    console.error("Package discovery failed to render.");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Travelora journeys</p>
        <h1 className="font-display mt-5 text-4xl text-forest">Something went wrong</h1>
        <p className="mt-4 text-sm leading-6 text-charcoal/60">
          We could not load the journeys right now. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 rounded-full bg-deep-green px-6 py-3 text-sm font-medium text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
