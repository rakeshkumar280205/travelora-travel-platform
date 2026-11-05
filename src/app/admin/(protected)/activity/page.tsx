import { Activity } from "lucide-react";

export default function AdminActivityPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Audit trail</p>
        <h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">Activity log</h1>
        <p className="mt-4 text-sm leading-7 text-charcoal/60">
          A centralized record of package publications, consultant assignments, and enquiry status changes.
        </p>
      </header>
      <section className="border border-charcoal/10 bg-white px-6 py-16 text-center sm:px-12">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ivory text-gold">
          <Activity size={26} aria-hidden="true" />
        </div>
        <h2 className="font-display mt-5 text-2xl text-forest">No recent workspace activity</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-charcoal/65">
          Workspace activities are logged when staff members update packages, change enquiry statuses, or save notes.
        </p>
      </section>
    </div>
  );
}
