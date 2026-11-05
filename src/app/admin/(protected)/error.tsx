"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin workspace error:", error);
  }, [error]);

  return (
    <div className="border border-charcoal/10 bg-white px-6 py-16 text-center" role="alert" aria-live="assertive">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Something went wrong</p>
      <h1 className="font-display mt-3 text-4xl text-forest">The studio is unavailable.</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/65">
        We could not load this workspace. Please try again.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-deep-green px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold cursor-pointer"
      >
        Try again
      </button>
    </div>
  );
}
