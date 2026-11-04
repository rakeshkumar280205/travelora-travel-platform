"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Enquiry = {
  id: string; customerName: string; email: string; phone: string | null; message: string; destination: string;
  travelMonth: string | null; durationDays: number | null; adults: number; children: number | null;
  budget: string | number | null; currency: string | null; status: string; assignedConsultantId: string | null;
  package: { id: string; slug: string; title: string; destination: string } | null;
  assignedConsultant: { id: string; name: string; email: string } | null;
  notes: Array<{ id: string; body: string; createdAt: string; author: { name: string } }>;
  replies: Array<{ id: string; body: string; isDraft: boolean; updatedAt: string; author: { name: string } }>;
  activities: Array<{ id: string; type: string; createdAt: string; actor: { name: string } | null }>;
  createdAt: string;
};
type ExtractedRequirements = {
  destination: string | null; travelStartDate: string | null; travelMonth: string | null;
  durationDays: number | null; adults: number | null; children: number | null; budget: number | null;
  currency: string | null; hotelPreference: string | null; specialRequirements: string[];
  confidence: Record<string, string>; missingFields: string[]; uncertainFields: string[];
};
type Recommendation = {
  packageId: string; matchingReasons: string[]; uncertainFit: string[];
  package: { id: string; title: string; slug: string; destination: string; durationDays: number; hotelCategory: string; seasonalPrices: Array<{ seasonName: string; amount: string; currency: string; pricingBasis: string }> };
};
type Consultant = { id: string; name: string; email: string };
const statuses = ["NEW", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESPONDED", "CONVERTED", "CLOSED"];

export function EnquiryDetail({ enquiry: initial, consultants, canAssign, canUseAi }: { enquiry: Enquiry; consultants: Consultant[]; canAssign: boolean; canUseAi: boolean }) {
  const [enquiry, setEnquiry] = useState(initial);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedRequirements | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationNote, setRecommendationNote] = useState<string | null>(null);

  async function update(payload: Record<string, unknown>) {
    setNotice(null); setError(null);
    const response = await fetch(`/api/admin/enquiries/${enquiry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error?.message ?? "Could not update enquiry."); return; }
    setEnquiry((current) => ({ ...current, ...result.data })); setNotice("Enquiry updated.");
  }
  async function addRecord(event: FormEvent<HTMLFormElement>, endpoint: "notes" | "reply") {
    event.preventDefault(); setNotice(null); setError(null);
    const form = event.currentTarget;
    const response = await fetch(`/api/admin/enquiries/${enquiry.id}/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: new FormData(form).get("body") }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error?.message ?? "Could not save this record."); return; }
    if (endpoint === "notes") setEnquiry((current) => ({ ...current, notes: [...current.notes, result.data] }));
    else setEnquiry((current) => ({ ...current, replies: [result.data, ...current.replies] }));
    form.reset(); setNotice(endpoint === "notes" ? "Internal note saved." : "Reply draft saved. It has not been sent.");
  }
  async function runAi(action: "extract" | "recommendations" | "ai-reply") {
    setAiBusy(action); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiry.id}/${action}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "AI action failed.");
      if (action === "extract") setExtracted(result.data);
      if (action === "recommendations") {
        setRecommendations(result.data.recommendations);
        setRecommendationNote(result.data.noGoodMatchReason);
      }
      if (action === "ai-reply") {
        setEnquiry((current) => ({ ...current, replies: [result.data, ...current.replies] }));
      }
      setNotice(action === "ai-reply" ? "AI reply draft saved for review. It has not been sent." : "AI suggestions are ready for review.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "AI action failed.");
    } finally {
      setAiBusy(null);
    }
  }
  async function saveCorrections(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!extracted) return;
    const form = new FormData(event.currentTarget);
    await update({
      destination: form.get("destination") || undefined,
      travelMonth: form.get("travelMonth") || null,
      durationDays: form.get("durationDays") ? Number(form.get("durationDays")) : null,
      adults: form.get("adults") ? Number(form.get("adults")) : undefined,
      children: form.get("children") ? Number(form.get("children")) : null,
      budget: form.get("budget") ? Number(form.get("budget")) : null,
      currency: form.get("currency") || null,
    });
    setNotice("Reviewed requirements saved.");
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/enquiries" className="text-sm text-forest hover:text-gold">← Back to enquiries</Link>
      <header className="flex flex-col gap-5 border-b border-charcoal/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs uppercase tracking-[0.24em] text-gold">Enquiry detail</p><h1 className="font-display mt-3 text-4xl text-forest sm:text-5xl">{enquiry.customerName}</h1><p className="mt-3 text-sm text-charcoal/60">{enquiry.email} · {enquiry.destination}</p></div>
        <span className="rounded-full bg-gold/20 px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] text-deep-green">{enquiry.status.replaceAll("_", " ")}</span>
      </header>
      {notice && <p role="status" className="border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">{notice}</p>}
      {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {canUseAi && <Panel title="AI assistant">
        <p className="text-xs leading-5 text-charcoal/55">AI suggestions are advisory. Review every field before saving or using a draft.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <AiButton busy={aiBusy === "extract"} onClick={() => void runAi("extract")}>Extract requirements</AiButton>
          <AiButton busy={aiBusy === "recommendations"} onClick={() => void runAi("recommendations")}>Find package matches</AiButton>
          <AiButton busy={aiBusy === "ai-reply"} onClick={() => void runAi("ai-reply")}>Draft consultant reply</AiButton>
        </div>
        {extracted && <form onSubmit={saveCorrections} className="mt-6 grid gap-4 border-t border-charcoal/10 pt-5">
          <p className="text-sm font-medium text-forest">Suggested requirements · review before saving</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <SuggestionInput label="Destination" name="destination" value={extracted.destination ?? ""} confidence={extracted.confidence.destination} />
            <SuggestionInput label="Travel month" name="travelMonth" type="month" value={extracted.travelMonth ?? ""} confidence={extracted.confidence.travelMonth} />
            <SuggestionInput label="Duration" name="durationDays" type="number" value={extracted.durationDays?.toString() ?? ""} confidence={extracted.confidence.durationDays} />
            <SuggestionInput label="Adults" name="adults" type="number" value={extracted.adults?.toString() ?? ""} confidence={extracted.confidence.adults} />
            <SuggestionInput label="Children" name="children" type="number" value={extracted.children?.toString() ?? ""} confidence={extracted.confidence.children} />
            <SuggestionInput label="Budget" name="budget" type="number" value={extracted.budget?.toString() ?? ""} confidence={extracted.confidence.budget} />
            <SuggestionInput label="Currency" name="currency" value={extracted.currency ?? ""} confidence={extracted.confidence.currency} />
          </div>
          <p className="text-xs text-charcoal/55">Unknown values are left blank. Children&apos;s ages and pricing are never inferred.</p>
          <button type="submit" className="w-fit rounded-full bg-deep-green px-5 py-2.5 text-xs font-medium text-white hover:bg-forest">Save reviewed requirements</button>
        </form>}
        {(extracted?.missingFields.length || extracted?.uncertainFields.length) ? <p className="mt-4 text-xs text-charcoal/55">Uncertain or missing: {[...(extracted?.missingFields ?? []), ...(extracted?.uncertainFields ?? [])].join(", ")}</p> : null}
        {(recommendations.length > 0 || recommendationNote) && <div className="mt-6 border-t border-charcoal/10 pt-5">
          <p className="text-sm font-medium text-forest">Published package recommendations</p>
          <div className="mt-3 space-y-3">{recommendations.map((recommendation) => <div key={recommendation.packageId} className="rounded-lg border border-charcoal/10 p-4"><p className="font-medium text-forest">{recommendation.package.title}</p><p className="mt-1 text-xs text-charcoal/55">{recommendation.package.destination} · {recommendation.package.durationDays} days · {recommendation.package.hotelCategory}</p><p className="mt-2 text-sm text-charcoal/65">{recommendation.matchingReasons.join(" ")}</p>{recommendation.package.seasonalPrices[0] && <p className="mt-2 text-xs text-charcoal/55">Published indicative price: {recommendation.package.seasonalPrices[0].currency} {recommendation.package.seasonalPrices[0].amount} · {recommendation.package.seasonalPrices[0].pricingBasis}</p>}</div>)}</div>
          {recommendationNote && <p className="mt-3 text-xs text-charcoal/55">{recommendationNote}</p>}
        </div>}
      </Panel>}
      <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-8">
          <Panel title="Original message"><p className="whitespace-pre-wrap text-sm leading-7 text-charcoal/70">{enquiry.message}</p></Panel>
          <Panel title="Travel requirements"><dl className="grid gap-4 text-sm sm:grid-cols-2"><Info label="Destination" value={enquiry.destination} /><Info label="Package" value={enquiry.package?.title ?? "General enquiry"} /><Info label="Travel month" value={enquiry.travelMonth ?? "Not specified"} /><Info label="Duration" value={enquiry.durationDays ? `${enquiry.durationDays} days` : "Not specified"} /><Info label="Travellers" value={`${enquiry.adults} adults${enquiry.children ? `, ${enquiry.children} children` : ""}`} /><Info label="Budget" value={enquiry.budget ? `${enquiry.currency ?? "INR"} ${enquiry.budget}` : "Not specified"} /></dl></Panel>
          <Panel title="Internal notes"><div className="space-y-4">{enquiry.notes.length === 0 ? <p className="text-sm text-charcoal/55">No internal notes yet.</p> : enquiry.notes.map((note) => <div key={note.id} className="border-l-2 border-gold pl-4"><p className="whitespace-pre-wrap text-sm leading-6 text-charcoal/70">{note.body}</p><p className="mt-2 text-xs text-charcoal/45">{note.author.name} · {formatDate(note.createdAt)}</p></div>)}<form onSubmit={(event) => addRecord(event, "notes")} className="grid gap-3 border-t border-charcoal/10 pt-5"><label htmlFor="note-body" className="text-sm font-medium text-forest">Add private note</label><textarea id="note-body" name="body" required maxLength={4000} rows={3} className="rounded-lg border border-charcoal/15 p-3 text-sm outline-none focus:border-forest" /><button className="w-fit rounded-full bg-deep-green px-5 py-2.5 text-xs font-medium text-white hover:bg-forest">Save note</button></form></div></Panel>
          <Panel title="Reply drafts">{enquiry.replies.length > 0 && <div className="mb-5 space-y-4">{enquiry.replies.map((reply) => <div key={reply.id} className="border-l-2 border-forest pl-4"><p className="whitespace-pre-wrap text-sm leading-6 text-charcoal/70">{reply.body}</p><p className="mt-2 text-xs text-charcoal/45">{reply.author.name} · {formatDate(reply.updatedAt)} · Draft only</p></div>)}</div>}<form onSubmit={(event) => addRecord(event, "reply")} className="grid gap-3"><label htmlFor="reply-body" className="text-sm font-medium text-forest">Save a response draft</label><textarea id="reply-body" name="body" required maxLength={8000} rows={5} className="rounded-lg border border-charcoal/15 p-3 text-sm outline-none focus:border-forest" /><p className="text-xs text-charcoal/45">Saving does not send email or WhatsApp messages.</p><button className="w-fit rounded-full bg-deep-green px-5 py-2.5 text-xs font-medium text-white hover:bg-forest">Save reply draft</button></form></Panel>
        </div>
        <aside className="space-y-8">
          <Panel title="Manage"><div className="grid gap-4"><label className="grid gap-2 text-sm font-medium text-forest">Status<select value={enquiry.status} onChange={(event) => void update({ status: event.target.value })} className="min-h-11 rounded-lg border border-charcoal/15 bg-white px-3 text-sm">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>{canAssign && <label className="grid gap-2 text-sm font-medium text-forest">Assigned consultant<select value={enquiry.assignedConsultantId ?? ""} onChange={(event) => void update({ assignedConsultantId: event.target.value || null })} className="min-h-11 rounded-lg border border-charcoal/15 bg-white px-3 text-sm"><option value="">Unassigned</option>{consultants.map((consultant) => <option key={consultant.id} value={consultant.id}>{consultant.name}</option>)}</select></label>}</div></Panel>
          <Panel title="Customer"><dl className="space-y-4 text-sm"><Info label="Email" value={enquiry.email} /><Info label="Phone" value={enquiry.phone ?? "Not provided"} /><Info label="Received" value={formatDate(enquiry.createdAt)} /></dl></Panel>
          <Panel title="Activity"><div className="space-y-4">{enquiry.activities.length === 0 ? <p className="text-sm text-charcoal/55">No activity recorded.</p> : enquiry.activities.map((activity) => <div key={activity.id} className="border-l border-charcoal/15 pl-4"><p className="text-sm text-forest">{activity.type.replaceAll("_", " ").toLowerCase()}</p><p className="mt-1 text-xs text-charcoal/45">{activity.actor?.name ?? "Public visitor"} · {formatDate(activity.createdAt)}</p></div>)}</div></Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="border border-charcoal/10 bg-white p-6"><h2 className="font-display text-2xl text-forest">{title}</h2><div className="mt-5">{children}</div></section>; }
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs uppercase tracking-[0.12em] text-charcoal/45">{label}</dt><dd className="mt-1 text-forest">{value}</dd></div>; }
function AiButton({ busy, onClick, children }: { busy: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" disabled={busy} onClick={onClick} className="rounded-full border border-forest/20 px-4 py-2.5 text-xs font-medium text-forest hover:border-gold disabled:opacity-50">{busy ? "Working..." : children}</button>; }
function SuggestionInput({ label, name, type = "text", value, confidence }: { label: string; name: string; type?: string; value: string; confidence: string }) { return <label className="grid gap-1 text-xs font-medium text-forest">{label} <span className="font-normal text-charcoal/45">Confidence: {confidence}</span><input name={name} type={type} defaultValue={value} className="min-h-10 rounded-lg border border-charcoal/15 px-3 text-sm font-normal text-charcoal" /></label>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
