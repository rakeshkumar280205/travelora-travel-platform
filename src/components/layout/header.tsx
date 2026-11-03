"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const links = [
  { label: "Home", href: "/" },
  { label: "Explore packages", href: "#journeys" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#enquire" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-20 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-16">
        <Link href="/" className="group" aria-label="Travelora home">
          <span className="block font-display text-3xl tracking-[-0.04em]">TRAVELORA</span>
          <span className="block text-[9px] uppercase tracking-[0.3em] text-white/55">
            Journeys beyond ordinary
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/75 transition-colors hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
          <Button href="#enquire">Enquire</Button>
        </nav>

        <button
          type="button"
          className="rounded-full border border-white/25 p-3 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-navigation"
          className="mx-4 rounded-2xl border border-white/15 bg-deep-green/95 p-5 shadow-2xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="#enquire" className="mt-3" onClick={() => setOpen(false)}>
              Enquire
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
