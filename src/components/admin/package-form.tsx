"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Itinerary = { dayNumber: number; title: string; description: string };
type Price = { seasonName: string; startDate: string; endDate: string; amount: string; currency: string; pricingBasis: string };
type PackageFormData = {
  slug: string; title: string; destination: string; durationDays: number;
  description: string; category: string; hotelCategory: string; status: "DRAFT" | "PUBLISHED";
  seasonalPrices: Price[]; itineraryDays: Itinerary[];
};

const blankPrice = (): Price => ({ seasonName: "", startDate: "", endDate: "", amount: "", currency: "INR", pricingBasis: "Per person; indicative package price; GST treatment to be confirmed" });
const blankDay = (dayNumber: number): Itinerary => ({ dayNumber, title: "", description: "" });

export function PackageForm({ initial, packageId }: { initial: PackageFormData; packageId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof PackageFormData>(key: K, value: PackageFormData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function publish() {
    if (!packageId || !window.confirm("Publish the saved package as a new public version?")) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/packages/${packageId}/publish`, { method: "POST" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.details ? formatValidationError(payload.error.details) : payload?.error?.message ?? "The package could not be published.");
      setSaving(false);
      return;
    }
    router.refresh();
    setSaving(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch(packageId ? `/api/admin/packages/${packageId}` : "/api/admin/packages", {
      method: packageId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, durationDays: Number(form.durationDays), seasonalPrices: form.seasonalPrices.map((price) => ({ ...price, amount: Number(price.amount) })), itineraryDays: form.itineraryDays.map((day, index) => ({ ...day, dayNumber: index + 1 })) }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.error?.details ? formatValidationError(payload.error.details) : payload?.error?.message ?? "The package could not be saved.");
      setSaving(false);
      return;
    }

    router.push("/admin/packages");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      {error && <div role="alert" className="border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-800">{error}</div>}
      <section className="border border-charcoal/10 bg-white p-6 sm:p-8">
        <h2 className="font-display text-2xl text-forest">Package details</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Title" value={form.title} onChange={(value) => update("title", value)} required />
          <Field label="Slug / package code" value={form.slug} onChange={(value) => update("slug", value)} required />
          <Field label="Destination" value={form.destination} onChange={(value) => update("destination", value)} required />
          <Field label="Duration in days" type="number" value={String(form.durationDays)} onChange={(value) => update("durationDays", Number(value))} required />
          <Field label="Category" value={form.category} onChange={(value) => update("category", value)} required />
          <Field label="Hotel category" value={form.hotelCategory} onChange={(value) => update("hotelCategory", value)} required />
          <div className="block text-sm font-medium text-forest">Status<div className="mt-2 border border-charcoal/20 bg-ivory px-4 py-3 font-normal text-charcoal/60">{form.status === "PUBLISHED" ? "Published draft" : "Draft"}</div></div>
          <label className="block text-sm font-medium text-forest md:col-span-2">Description<textarea required value={form.description} onChange={(event) => update("description", event.target.value)} rows={5} className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none focus:border-gold" /></label>
        </div>
      </section>
      <EditorSection title="Itinerary">
        <div className="space-y-4">
          {form.itineraryDays.map((day, index) => <div key={index} className="border border-charcoal/10 p-4"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.15em] text-gold">Day {index + 1}</p><button type="button" onClick={() => update("itineraryDays", form.itineraryDays.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-red-700 hover:underline">Delete</button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Day title" value={day.title} onChange={(value) => update("itineraryDays", replaceAt(form.itineraryDays, index, { ...day, title: value }))} required /><label className="block text-sm font-medium text-forest md:col-span-2">Description<textarea required value={day.description} onChange={(event) => update("itineraryDays", replaceAt(form.itineraryDays, index, { ...day, description: event.target.value }))} rows={3} className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none focus:border-gold" /></label></div></div>)}
        </div>
        <button type="button" onClick={() => update("itineraryDays", [...form.itineraryDays, blankDay(form.itineraryDays.length + 1)])} className="mt-5 text-sm font-medium text-forest hover:text-gold">+ Add itinerary day</button>
      </EditorSection>
      <EditorSection title="Seasonal pricing">
        <div className="space-y-4">
          {form.seasonalPrices.map((price, index) => <div key={index} className="border border-charcoal/10 p-4"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[0.15em] text-gold">Season {index + 1}</p><button type="button" onClick={() => update("seasonalPrices", form.seasonalPrices.filter((_, itemIndex) => itemIndex !== index))} className="text-xs text-red-700 hover:underline">Delete</button></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Field label="Season name" value={price.seasonName} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, seasonName: value }))} required /><Field label="Currency" value={price.currency} maxLength={3} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, currency: value.toUpperCase() }))} required /><Field label="Start date" type="date" value={price.startDate} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, startDate: value }))} required /><Field label="End date" type="date" value={price.endDate} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, endDate: value }))} required /><Field label="Amount" type="number" value={price.amount} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, amount: value }))} required /><Field label="Pricing basis" value={price.pricingBasis} onChange={(value) => update("seasonalPrices", replaceAt(form.seasonalPrices, index, { ...price, pricingBasis: value }))} required /></div></div>)}
        </div>
        <button type="button" onClick={() => update("seasonalPrices", [...form.seasonalPrices, blankPrice()])} className="mt-5 text-sm font-medium text-forest hover:text-gold">+ Add seasonal price</button>
        <p className="mt-5 text-xs leading-5 text-charcoal/50">Use explicit pricing basis text. Do not add child pricing or unconfirmed availability.</p>
      </EditorSection>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link href="/admin/packages" className="inline-flex min-h-12 items-center justify-center rounded-full border border-charcoal/20 px-6 text-sm font-medium text-forest hover:border-forest">Cancel</Link>{packageId && <><Link href={`/admin/packages/${packageId}/preview`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-charcoal/20 px-6 text-sm font-medium text-forest hover:border-forest">Preview</Link><button type="button" onClick={publish} disabled={saving} className="inline-flex min-h-12 items-center justify-center rounded-full border border-forest px-6 text-sm font-medium text-forest hover:bg-forest hover:text-white disabled:opacity-60">Publish update</button></>}<button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center rounded-full bg-gold px-6 text-sm font-medium text-deep-green hover:bg-forest hover:text-white disabled:opacity-60">{saving ? "Saving..." : packageId ? "Save changes" : "Create draft package"}</button></div>
    </form>
  );
}

function Field({ label, value, onChange, type = "text", required = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; maxLength?: number }) {
  return <label className="block text-sm font-medium text-forest">{label}<input type={type} required={required} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 font-normal outline-none focus:border-gold" /></label>;
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border border-charcoal/10 bg-white p-6 sm:p-8"><h2 className="font-display text-2xl text-forest">{title}</h2><div className="mt-6">{children}</div></section>;
}

function replaceAt<T>(items: T[], index: number, value: T) {
  return items.map((item, itemIndex) => itemIndex === index ? value : item);
}

function formatValidationError(details: Record<string, string[] | undefined>) {
  return Object.entries(details).flatMap(([field, messages]) => messages?.map((message) => `${field}: ${message}`) ?? []).join(" ");
}
