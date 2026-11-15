"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Icon } from "./Icon";

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await sendJson("/api/auth/logout", "POST");
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className={compact ? "btn btn-secondary btn-sm" : "btn btn-secondary btn-block"}
      aria-label="Log out"
    >
      <Icon name="logout" size={16} />
      {compact ? (busy ? "Leaving…" : "Log out") : busy ? "Logging out…" : "Log out"}
    </button>
  );
}
