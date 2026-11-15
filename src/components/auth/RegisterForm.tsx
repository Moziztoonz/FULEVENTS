"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Alert } from "../Alert";
import { Icon } from "../Icon";
import { PasswordInput } from "../PasswordInput";

type Role = "student" | "organizer";

export function RegisterForm({ initialRole = "student" }: { initialRole?: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    setFields({});

    const result = await sendJson<{ redirect?: string }>("/api/auth/register", "POST", {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      role,
      organizationName: String(form.get("organizationName") ?? ""),
      contactPhone: String(form.get("contactPhone") ?? ""),
    });

    if (!result.ok) {
      setError(result.data.error ?? "We could not create your account.");
      setFields(result.data.fields ?? {});
      setBusy(false);
      return;
    }
    router.push(result.data.redirect || "/events");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <fieldset>
        <legend className="label">I am joining as</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              { value: "student", title: "Student", body: "Attend events", icon: "users" },
              { value: "organizer", title: "Organiser", body: "Run events", icon: "briefcase" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value)}
              aria-pressed={role === option.value}
              className={cn(
                "rounded-2xl border p-3 text-left transition-colors",
                role === option.value
                  ? "border-brand bg-brand-soft/70 ring-1 ring-brand"
                  : "border-line bg-white hover:border-brand-ring",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-ink">
                <Icon name={option.icon} size={16} className="text-brand-dark" />
                {option.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">{option.body}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="fullName" className="label">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          placeholder="Aisha Mohammed"
          className="input"
          aria-invalid={fields.fullName ? "true" : undefined}
        />
        {fields.fullName && <p className="field-error">{fields.fullName}</p>}
      </div>

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
          aria-invalid={fields.email ? "true" : undefined}
        />
        {fields.email ? (
          <p className="field-error">{fields.email}</p>
        ) : (
          <p className="hint">Use an email you check often.</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="label">
          Phone number <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="0803 123 4567"
          className="input"
          aria-invalid={fields.phone ? "true" : undefined}
        />
        {fields.phone && <p className="field-error">{fields.phone}</p>}
      </div>

      {role === "organizer" && (
        <>
          <div>
            <label htmlFor="organizationName" className="label">
              Club or organisation name
            </label>
            <input
              id="organizationName"
              name="organizationName"
              required
              placeholder="e.g. FULAFIA Debate Society"
              className="input"
              aria-invalid={fields.organizationName ? "true" : undefined}
            />
            {fields.organizationName && <p className="field-error">{fields.organizationName}</p>}
          </div>
          <div>
            <label htmlFor="contactPhone" className="label">
              Contact phone for students
            </label>
            <input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              required
              placeholder="0803 123 4567"
              className="input"
              aria-invalid={fields.contactPhone ? "true" : undefined}
            />
            <p className="hint">Students call this number about paid tickets.</p>
            {fields.contactPhone && <p className="field-error">{fields.contactPhone}</p>}
          </div>
        </>
      )}

      <PasswordInput
        name="password"
        label="Password"
        autoComplete="new-password"
        hint="At least 8 characters."
        error={fields.password}
      />

      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
        {busy ? "Creating your account…" : "Create account"}
      </button>

      <p className="pt-1 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-dark hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
