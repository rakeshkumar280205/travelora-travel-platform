"use client";

import { FormEvent, useState } from "react";

import { publicEnquirySchema } from "@/lib/validation/enquiry-schemas";

type EnquiryFormProps = {
  packageSlug?: string;
  destination?: string;
};

const initialMessage =
  "Tell us a little about how you would like to travel, and anything you would love to experience.";

export function EnquiryForm({ packageSlug, destination }: EnquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    const validation = publicEnquirySchema.safeParse(payload);

    if (!validation.success) {
      setFeedback({
        type: "error",
        message: validation.error.issues[0]?.message ?? "Please check the form and try again.",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const result = (await response.json()) as {
        data?: { message?: string };
        error?: { message?: string };
      };

      if (!response.ok) {
        throw new Error(result.error?.message ?? "We could not submit your enquiry.");
      }

      setFeedback({
        type: "success",
        message: result.data?.message ?? "Thank you for contacting Travelora. We will be in touch soon.",
      });
      form.reset();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "We could not submit your enquiry.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-2xl bg-white/90 p-6 text-charcoal shadow-xl sm:p-8">
      {packageSlug && <input type="hidden" name="packageSlug" value={packageSlug} />}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="customerName" required autoComplete="name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" />
        <Field
          label="Destination"
          name="destination"
          defaultValue={destination}
          readOnly={Boolean(destination)}
          required
        />
        <Field label="Preferred month" name="travelMonth" type="month" />
        <Field label="Duration in days" name="durationDays" type="number" min="1" max="365" />
        <Field label="Adults" name="adults" type="number" min="1" max="50" defaultValue="2" required />
        <Field label="Children" name="children" type="number" min="0" max="50" defaultValue="0" />
        <Field label="Budget" name="budget" type="number" min="0" step="0.01" />
        <label className="grid gap-2 text-sm font-medium text-forest">
          Currency
          <select
            name="currency"
            defaultValue="INR"
            className="min-h-12 rounded-lg border border-charcoal/15 bg-white px-4 font-normal text-charcoal outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
          >
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-forest">
        Additional message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder={initialMessage}
          className="rounded-lg border border-charcoal/15 bg-white px-4 py-3 font-normal text-charcoal outline-none focus:border-forest focus:ring-2 focus:ring-gold/40"
        />
      </label>
      {feedback && (
        <p
          role="status"
          className={feedback.type === "success" ? "text-sm text-forest" : "text-sm text-red-700"}
        >
          {feedback.message}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 items-center justify-center rounded-full bg-deep-green px-6 text-sm font-medium text-white transition-colors hover:bg-forest disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Sending enquiry..." : "Send enquiry"}
      </button>
      <p className="text-xs leading-5 text-charcoal/55">
        We only use these details to review your travel enquiry. No email or WhatsApp message is sent automatically.
      </p>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  defaultValue?: string;
  readOnly?: boolean;
  min?: string;
  max?: string;
  step?: string;
};

function Field({ label, name, type = "text", ...props }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-forest">
      {label}
      <input
        name={name}
        type={type}
        className="min-h-12 rounded-lg border border-charcoal/15 bg-white px-4 font-normal text-charcoal outline-none focus:border-forest focus:ring-2 focus:ring-gold/40 read-only:bg-ivory"
        {...props}
      />
    </label>
  );
}
