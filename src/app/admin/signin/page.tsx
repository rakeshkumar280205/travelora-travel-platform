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
        <Link href="/" className="block text-center font-display text-4xl tracking-[-0.04em] text-white">TRAVELORA</Link>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-white/50">Staff studio</p>
        <form onSubmit={handleSubmit} className="mt-10 border border-white/15 bg-white p-7 shadow-2xl sm:p-10">
          <h1 className="font-display text-3xl text-forest">Welcome back</h1>
          <p className="mt-3 text-sm leading-6 text-charcoal/55">Sign in to manage Travelora journeys.</p>
          <label className="mt-8 block text-sm font-medium text-forest">
            Email
            <input name="email" type="email" required autoComplete="email" className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 outline-none focus:border-gold" />
          </label>
          <label className="mt-5 block text-sm font-medium text-forest">
            Password
            <input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full border border-charcoal/20 bg-ivory px-4 py-3 outline-none focus:border-gold" />
          </label>
          {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="mt-7 w-full rounded-full bg-gold px-6 py-3 text-sm font-medium text-deep-green transition-colors hover:bg-forest hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
