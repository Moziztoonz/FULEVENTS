"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Icon } from "./Icon";

export function MarkNotificationsRead({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  if (!hasUnread) return null;

  async function markAll() {
    setBusy(true);
    await sendJson("/api/notifications/read", "POST", {});
    setBusy(false);
    router.refresh();
  }

  return (
    <button type="button" onClick={markAll} className="btn btn-secondary btn-sm" disabled={busy}>
      <Icon name="check" size={15} />
      {busy ? "Marking…" : "Mark all as read"}
    </button>
  );
}
