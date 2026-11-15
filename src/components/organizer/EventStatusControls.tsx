"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "../Alert";
import { Icon } from "../Icon";

export function EventStatusControls({
  eventId,
  eventTitle,
  status,
  registrationCount,
}: {
  eventId: string;
  eventTitle: string;
  status: string;
  registrationCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirming, setConfirming] = useState<null | "delete" | "cancel">(null);

  async function changeStatus(next: string) {
    setBusy(next);
    setMessage(null);
    const result = await sendJson(`/api/events/${eventId}/status`, "POST", { status: next });
    setBusy(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.data.error ?? "We could not update this event." });
      return;
    }
    setMessage({ type: "success", text: `Event updated: ${next.replace("_", " ")}.` });
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    const result = await sendJson(`/api/events/${eventId}`, "DELETE");
    setBusy(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.data.error ?? "We could not delete this event." });
      setConfirming(null);
      return;
    }
    router.push("/organizer");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {message && <Alert variant={message.type}>{message.text}</Alert>}

      <div className="flex flex-wrap gap-2">
        {status === "draft" && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => changeStatus("published")} disabled={busy !== null}>
            <Icon name="check" size={15} /> {busy === "published" ? "Publishing…" : "Publish event"}
          </button>
        )}
        {(status === "published" || status === "sold_out") && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeStatus("draft")} disabled={busy !== null}>
            Unpublish
          </button>
        )}
        {status === "published" && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeStatus("sold_out")} disabled={busy !== null}>
            Mark as sold out
          </button>
        )}
        {status === "sold_out" && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeStatus("published")} disabled={busy !== null}>
            Reopen tickets
          </button>
        )}
        {status === "cancelled" && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeStatus("published")} disabled={busy !== null}>
            Reactivate event
          </button>
        )}
        {status !== "cancelled" && (
          <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming("cancel")} disabled={busy !== null}>
            Cancel event
          </button>
        )}
        <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming("delete")} disabled={busy !== null}>
          <Icon name="trash" size={14} /> Delete
        </button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {confirming === "delete" ? "Delete this event?" : "Cancel this event?"}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              {confirming === "delete" ? (
                <>
                  <strong className="text-ink">{eventTitle}</strong> and its {registrationCount} registration
                  {registrationCount === 1 ? "" : "s"} will be removed for good. Tickets will stop working. This
                  cannot be undone.
                </>
              ) : (
                <>
                  <strong className="text-ink">{eventTitle}</strong> will be marked cancelled. All{" "}
                  {registrationCount} attendee{registrationCount === 1 ? "" : "s"} will be notified, and tickets will
                  not be valid for entry.
                </>
              )}
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setConfirming(null)} disabled={busy !== null}>
                Keep event
              </button>
              <button
                type="button"
                className="btn btn-danger flex-1"
                onClick={() => (confirming === "delete" ? remove() : (setConfirming(null), changeStatus("cancelled")))}
                disabled={busy !== null}
              >
                {busy ? "Working…" : confirming === "delete" ? "Delete event" : "Cancel event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
