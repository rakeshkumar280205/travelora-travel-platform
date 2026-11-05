"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Package discovery failed to render:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-6 py-20">
      <div className="max-w-md text-center" role="alert" aria-live="assertive">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">Travelora journeys</p>
        <h1 className="font-display mt-5 text-4xl text-forest sm:text-5xl">Something went wrong</h1>
        <p className="mt-4 text-sm leading-6 text-charcoal/65">
          We could not load the journeys right now. Please try again or return home.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-deep-green px-6 text-sm font-medium text-white transition-colors hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-charcoal/20 px-6 text-sm font-medium text-forest transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
          >
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
