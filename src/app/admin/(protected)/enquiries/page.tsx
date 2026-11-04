export default function AdminEnquiriesPage() {
  return <Placeholder title="Enquiries" body="Enquiry management will be available in a later phase." />;
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-charcoal/10 bg-white px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">Coming later</p>
      <h1 className="font-display mt-3 text-4xl text-forest">{title}</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-charcoal/60">{body}</p>
    </div>
  );
}
