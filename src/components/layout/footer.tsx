import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-deep-green px-6 py-14 text-white sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-display text-3xl tracking-[-0.04em]">
            TRAVELORA
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-white/55">
            Journeys beyond ordinary. Thoughtfully made in South India.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Explore</p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
            <Link href="#journeys" className="hover:text-white">Journeys</Link>
            <Link href="#journeys" className="hover:text-white">Destinations</Link>
            <Link href="#enquire" className="hover:text-white">Plan your trip</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Company</p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/65">
            <Link href="#about" className="hover:text-white">Our approach</Link>
            <Link href="#enquire" className="hover:text-white">Contact</Link>
            <span>Private travel studio</span>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Say hello</p>
          <p className="mt-5 text-sm text-white/65">Contact details coming soon.</p>
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:justify-between">
        <span>© Travelora</span>
        <span>Crafted for curious travellers.</span>
      </div>
    </footer>
  );
}
