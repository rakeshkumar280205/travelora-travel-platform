import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main className="flex flex-1 items-center justify-center px-6 py-32 sm:px-10 lg:px-16">
        <div className="max-w-xl text-center">
          <p className="flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-gold">
            <span className="h-px w-8 bg-current" aria-hidden="true" />
            404 — Not found
            <span className="h-px w-8 bg-current" aria-hidden="true" />
          </p>
          <h1 className="font-display mt-6 text-5xl leading-tight text-forest sm:text-6xl">
            This trail leads somewhere unexpected.
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-7 text-charcoal/65">
            The journey or page you are looking for may have moved, been unpublished, or is no longer available.
          </p>4
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-deep-green px-6 text-sm font-medium text-white transition-colors hover:bg-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Return to homepage
            </Link>
            <Link
              href="/packages"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-charcoal/20 px-6 text-sm font-medium text-forest transition-colors hover:border-gold hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Explore all journeys
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
