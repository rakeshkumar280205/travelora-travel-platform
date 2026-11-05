"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminSignInPage() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      callbackUrl: "/admin",
      redirect: false,
    });
    if (result?.error) {
      setError("The email or password was not recognised.");
      setSubmitting(false);
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-deep-green px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="block text-center font-display text-4xl tracking-[-0.04em] text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        >
          TRAVELORA
        </Link>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-white/60">Staff studio</p>
        <form onSubmit={handleSubmit} className="mt-8 border border-white/15 bg-white p-7 shadow-2xl sm:p-10">
          <h1 className="font-display text-3xl text-forest">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-charcoal/65">Sign in to manage Travelora journeys.</p>
          <div className="mt-8 space-y-5">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-forest">
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                aria-required="true"
                autoComplete="email"
                className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-forest">
                Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                aria-required="true"
                autoComplete="current-password"
                className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-gold/40"
              />
            </div>
          </div>
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="mt-7 w-full rounded-full bg-gold px-6 py-3.5 text-sm font-medium text-deep-green transition-colors hover:bg-forest hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-white/60 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold rounded"
          >
            ← Return to public site
          </Link>
        </div>
      </div>
    </main>
  );
}
