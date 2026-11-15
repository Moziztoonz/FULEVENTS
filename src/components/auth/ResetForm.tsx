"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "../Alert";
import { PasswordInput } from "../PasswordInput";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await sendJson("/api/auth/reset", "POST", { token, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.data.error ?? "We could not reset your password.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1600);
  }

  if (!token) {
    return (
      <Alert variant="error" title="This link is incomplete">
        Ask for a new reset link from the{" "}
        <Link href="/forgot-password" className="font-semibold underline">
          forgot password page
        </Link>
        .
      </Alert>
    );
  }

  if (done) {
    return (
      <Alert variant="success" title="Password updated">
        You can now log in with your new password. Taking you to the login page…
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <PasswordInput
        name="password"
        label="New password"
        autoComplete="new-password"
        hint="At least 8 characters."
      />

      <div>
        <label htmlFor="confirm" className="label">
          Repeat new password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          placeholder="Type it again"
        />
      </div>

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
