"use client";

import { LogIn } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (loginError) {
      setError("Login failed. Please check your email and password.");
      return;
    }

    router.push(searchParams.get("redirect") || "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-panel px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand">Team Access</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Sign in to the contact manager</h1>
        </div>
        <form className="panel space-y-4 p-5 sm:p-6" onSubmit={submitLogin}>
          <label className="space-y-2">
            <span className="label">Email</span>
            <input
              required
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="space-y-2">
            <span className="label">Password</span>
            <input
              required
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
          <button type="submit" className="button-primary w-full" disabled={loading}>
            <LogIn aria-hidden="true" className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-panel" />}>
      <LoginForm />
    </Suspense>
  );
}
