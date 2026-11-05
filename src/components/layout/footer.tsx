import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-deep-green px-6 py-14 text-white sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="font-display text-3xl tracking-[-0.04em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            TRAVELORA
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/60">
            Journeys beyond ordinary. Thoughtfully made in South India.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Explore</p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/packages" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Journeys
            </Link>
            <Link href="/blog" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Journal
            </Link>
            <Link href="/#journeys" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Destinations
            </Link>
            <Link href="/#enquire" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Plan your trip
            </Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Company</p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/#about" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Our approach
            </Link>
            <Link href="/#enquire" className="transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
              Contact
            </Link>
            <span className="text-white/50">Private travel studio</span>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Say hello</p>
          <p className="mt-5 text-sm text-white/70">Contact details coming soon.</p>
          <Link
            href="/admin/signin"
            className="mt-4 inline-flex text-sm text-gold hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            Admin / staff login
          </Link>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:justify-between">
        <span>© Travelora</span>
        <span>Crafted for curious travellers.</span>
      </div>
    </footer>
  );
}
