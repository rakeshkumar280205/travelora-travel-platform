"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { label: "Home", href: "/" },
  { label: "Explore packages", href: "/packages" },
  { label: "Journal", href: "/blog" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/#enquire" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="absolute inset-x-0 top-0 z-20 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="group rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          aria-label="Travelora home"
        >
          <span className="block font-display text-3xl tracking-[-0.04em]">TRAVELORA</span>
          <span className="block text-[9px] uppercase tracking-[0.3em] text-white/60">
            Journeys beyond ordinary
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded text-sm text-white/80 transition-colors hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {link.label}
            </Link>
          ))}
          <Button href="/#enquire">Enquire</Button>
        </nav>

        <button
          type="button"
          className="rounded-full border border-white/25 p-3 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="mx-4 rounded-2xl border border-white/15 bg-deep-green/95 p-5 shadow-2xl backdrop-blur-sm lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm text-white/90 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/#enquire" className="mt-3" onClick={() => setOpen(false)}>
              Enquire
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
