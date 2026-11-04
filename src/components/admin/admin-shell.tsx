"use client";

import Link from "next/link";
import { Activity, LayoutDashboard, LogOut, Menu, Package, Settings, Users, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

type AdminUser = { name: string; email: string; role: "ADMIN" | "EDITOR" | "CONSULTANT" };

const navigation = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Packages", href: "/admin/packages", icon: Package },
  { label: "Enquiries", href: "/admin/enquiries", icon: Users },
  { label: "Activity log", href: "/admin/activity", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: AdminUser }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <div className="flex min-h-screen">
        <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-deep-green text-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <Link href="/admin" onClick={() => setOpen(false)} aria-label="Travelora admin home">
                <span className="block font-display text-3xl tracking-[-0.04em]">TRAVELORA</span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.28em] text-white/50">Studio</span>
              </Link>
              <button type="button" className="rounded-full p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Close admin navigation">
                <X size={19} />
              </button>
            </div>
            <nav className="mt-14 space-y-1" aria-label="Admin navigation">
              {navigation.map(({ label, href, icon: Icon }) => (
                <Link key={label} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-white/65 transition-colors hover:bg-white/10 hover:text-white">
                  <Icon size={18} />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-white/15 pt-5">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="mt-1 truncate text-xs text-white/50">{user.email}</p>
              <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-gold">{user.role}</p>
              <button type="button" onClick={() => signOut({ callbackUrl: "/admin/signin" })} className="mt-5 flex items-center gap-3 text-sm text-white/60 hover:text-white">
                <LogOut size={17} /> Log out
              </button>
            </div>
          </div>
        </aside>
        {open && <button type="button" className="fixed inset-0 z-20 bg-deep-green/50 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
        <div className="min-w-0 flex-1">
          <header className="flex h-20 items-center border-b border-charcoal/10 bg-white px-6 lg:hidden">
            <button type="button" onClick={() => setOpen(true)} className="rounded-full p-2 text-forest hover:bg-ivory" aria-label="Open admin navigation">
              <Menu size={22} />
            </button>
            <Link href="/admin" className="ml-4 font-display text-2xl tracking-[-0.04em] text-forest">TRAVELORA</Link>
          </header>
          <main className="mx-auto max-w-[1500px] px-6 py-10 sm:px-10 lg:px-12 lg:py-14">{children}</main>
        </div>
      </div>
    </div>
  );
}
