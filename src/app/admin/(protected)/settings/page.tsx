import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Preferences</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Workspace settings</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          Global configuration for Travelora travel operations, destinations, and team permissions.
        </p>
      </header>
      <section className="border border-charcoal/10 bg-white px-6 py-16 text-center sm:px-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ivory text-gold">
          <Settings size={26} aria-hidden="true" />
        </div>
        <h2 className="font-display mt-5 text-2xl text-forest">Workspace configuration</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-charcoal/65">
          Destination taxonomy, rate-limiting policies, and consultant assignment rules are managed through verified environment configuration.
        </p>
      </section>
    </div>
  );
}
