"use client";

import Link from "next/link";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "../Alert";

export function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);

    const result = await sendJson<{ message?: string; resetUrl?: string | null }>(
      "/api/auth/forgot",
      "POST",
      { email: String(form.get("email") ?? "") },
    );
    setBusy(false);
    if (!result.ok) {
      setError(result.data.error ?? "We could not start the reset. Please try again.");
      return;
    }
    setMessage(result.data.message ?? "Check your email for a reset link.");
    setResetUrl(result.data.resetUrl ?? null);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="ada@example.com"
          className="input"
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? "Creating reset link…" : "Send reset link"}
      </button>

      {resetUrl && (
        <div className="rounded-2xl border border-line bg-page p-4">
          <p className="text-xs font-semibold tracking-wide text-muted uppercase">Your reset link</p>
          <Link
            href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
            className="mt-1 block break-all text-sm font-semibold text-brand-dark underline"
          >
            {resetUrl.replace(/^https?:\/\/[^/]+/, "")}
          </Link>
          <p className="mt-2 text-xs text-muted">
            This link works once and expires in 60 minutes. Change PASSWORD_RESET_DELIVERY to
            &quot;outbox&quot; to hide it from this screen.
          </p>
        </div>
      )}

      <p className="pt-1 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-dark hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
