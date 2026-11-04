export default function AdminActivityPage() {
  return (
    <div className="border border-charcoal/10 bg-white px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Audit trail</p>
      <h1 className="font-display mt-3 text-4xl text-forest">Activity log</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">
        No activity has been recorded yet.
      </p>
    </div>
  );
}
