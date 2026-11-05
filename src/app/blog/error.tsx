"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side logging only
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Journal Error</p>
      <h1 className="font-display mt-4 text-3xl sm:text-4xl text-forest">
        Could not load journal stories
      </h1>
      <p className="mt-4 max-w-md text-sm text-charcoal/70 leading-relaxed">
        We encountered a temporary interruption retrieving stories from the archive.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-forest px-6 py-3 text-xs font-medium text-white hover:bg-forest/90 cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-charcoal/20 px-6 py-3 text-xs font-medium text-forest hover:bg-white"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
