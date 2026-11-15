"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { cn } from "@/lib/utils";

export function ActionButton({
  url,
  body,
  label,
  busyLabel,
  variant = "secondary",
  confirmText,
  method = "POST",
  className,
}: {
  url: string;
  body?: unknown;
  label: string;
  busyLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "soft";
  confirmText?: string;
  method?: "POST" | "DELETE" | "PATCH";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    const result = await sendJson(url, method, body);
    setBusy(false);
    if (!result.ok) {
      window.alert(result.data.error ?? "That action did not work. Please try again.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={cn("btn btn-sm", `btn-${variant}`, className)}
    >
      {busy ? (busyLabel ?? "Working…") : label}
    </button>
  );
}
