"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "../Alert";
import { PasswordInput } from "../PasswordInput";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    const result = await sendJson<{ redirect?: string }>("/api/auth/login", "POST", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    if (!result.ok) {
      setError(result.data.error ?? "We could not sign you in. Please try again.");
      setBusy(false);
      return;
    }
    router.push(next || result.data.redirect || "/events");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="ada@example.com"
          className="input"
        />
      </div>

      <PasswordInput name="password" label="Password" />

      <div className="-mt-2 text-right">
        <Link href="/forgot-password" className="text-xs font-semibold text-brand-dark hover:underline">
          Forgot password?
        </Link>
      </div>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? "Signing in…" : "Log in"}
      </button>

      <p className="pt-1 text-center text-sm text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-dark hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
