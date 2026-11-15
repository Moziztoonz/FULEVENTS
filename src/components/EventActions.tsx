"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Alert } from "./Alert";
import { Icon } from "./Icon";
import { PriceBadge } from "./Badges";

interface Props {
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  ticketType: string;
  price: number;
  isLoggedIn: boolean;
  isOwner: boolean;
  isSaved: boolean;
  isPast: boolean;
  remaining: number | null;
  capacity: number | null;
  registrationDeadline: string | null;
  open: boolean;
  closedReason?: string;
  existingTicket?: { id: string; status: string; ticketCode: string } | null;
  contactHref: string | null;
  contactLabel: string | null;
  contactValue: string | null;
}

export function EventActions(props: Props) {
  const router = useRouter();
  const [ticket, setTicket] = useState(props.existingTicket ?? null);
  const [saved, setSaved] = useState(props.isSaved);
  const [busy, setBusy] = useState<"register" | "save" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [shareText, setShareText] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportBusy, setReportBusy] = useState(false);

  async function register() {
    if (!props.isLoggedIn) {
      router.push(`/login?next=/events/${props.eventId}`);
      return;
    }
    setBusy("register");
    setMessage(null);
    const result = await sendJson<{ ticketId?: string; status?: string }>(
      "/api/registrations",
      "POST",
      { eventId: props.eventId },
    );
    setBusy(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.data.error ?? "We could not register you." });
      return;
    }
    if (result.data.ticketId) {
      router.push(`/tickets/${result.data.ticketId}?new=1`);
    }
  }

  async function toggleSave() {
    if (!props.isLoggedIn) {
      router.push(`/login?next=/events/${props.eventId}`);
      return;
    }
    setBusy("save");
    const result = await sendJson<{ saved?: boolean }>("/api/bookmarks", "POST", { eventId: props.eventId });
    setBusy(null);
    if (result.ok) {
      setSaved(Boolean(result.data.saved));
      setMessage({ type: "success", text: result.data.saved ? "Saved. Find it under Saved events." : "Removed from saved events." });
    } else {
      setMessage({ type: "error", text: result.data.error ?? "Could not update saved events." });
    }
  }

  async function share() {
    const url = `${window.location.origin}/events/${props.eventId}`;
    const data = { title: props.eventTitle, text: `${props.eventTitle} at FULAFIA`, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        // User dismissed the share sheet - fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareText("Link copied. Paste it wherever you like.");
    } catch {
      setShareText(url);
    }
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setReportBusy(true);
    setReportError(null);
    const result = await sendJson("/api/reports", "POST", {
      eventId: props.eventId,
      reason: String(form.get("reason") ?? ""),
      details: String(form.get("details") ?? ""),
    });
    setReportBusy(false);
    if (!result.ok) {
      setReportError(result.data.error ?? "We could not send that report.");
      return;
    }
    setReportSent(true);
    setReportOpen(false);
  }

  const registerLabel = () => {
    if (busy === "register") return "Reserving…";
    if (props.isOwner) return "This is your event";
    if (props.eventStatus === "cancelled") return "Event cancelled";
    if (props.eventStatus === "sold_out") return "Sold out";
    if (props.isPast) return "Event has ended";
    if (!props.open) return props.closedReason ?? "Registration closed";
    return props.ticketType === "free" ? "Get free ticket" : "Reserve a ticket";
  };

  const canRegister = props.open && !props.isOwner && !props.isPast && !ticket;

  return (
    <div className="space-y-3">
      {ticket ? (
        <div className="rounded-2xl border border-brand-ring bg-brand-soft/60 p-4">
          <p className="text-sm font-semibold text-brand-dark">
            {ticket.status === "confirmed" ? "You have a ticket for this event." : "Your seat is reserved."}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {ticket.status === "pending_payment"
              ? "Payment is handled directly with the organiser."
              : "Open your ticket to see the QR code."}
          </p>
          <Link href={`/tickets/${ticket.id}`} className="btn btn-primary btn-sm mt-3">
            <Icon name="ticket" size={15} /> View my ticket
          </Link>
        </div>
      ) : canRegister ? (
        <button type="button" onClick={register} className="btn btn-primary btn-lg btn-block" disabled={busy === "register"}>
          {registerLabel()}
        </button>
      ) : (
        <button type="button" className="btn btn-primary btn-lg btn-block" disabled>
          {registerLabel()}
        </button>
      )}

      {!props.isLoggedIn && canRegister && (
        <p className="text-center text-xs text-muted">
          You will be asked to log in. It takes less than a minute.
        </p>
      )}

      {props.ticketType === "paid" && props.contactHref && (
        <a
          href={props.contactHref}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn btn-secondary btn-block"
        >
          <Icon name={props.contactValue && props.contactHref.includes("wa.me") ? "whatsapp" : "external"} size={16} />
          {props.contactLabel ?? "Contact organiser"}
        </a>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={toggleSave} className="btn btn-secondary" disabled={busy === "save"} aria-pressed={saved}>
          <Icon name="bookmark" size={16} className={saved ? "fill-brand text-brand" : ""} />
          {saved ? "Saved" : "Save"}
        </button>
        <button type="button" onClick={share} className="btn btn-secondary">
          <Icon name="share" size={16} />
          Share
        </button>
      </div>

      <button
        type="button"
        onClick={() => (props.isLoggedIn ? setReportOpen(true) : router.push(`/login?next=/events/${props.eventId}`))}
        className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-semibold text-muted hover:text-danger"
      >
        <Icon name="flag" size={14} />
        Report this event
      </button>

      {message && (
        <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
      )}
      {shareText && (
        <Alert variant="info">
          <span className="break-all">{shareText}</span>
        </Alert>
      )}
      {reportSent && (
        <Alert variant="success">
          Thanks. Admins will review this event. We do not reveal who reported it.
        </Alert>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-3 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
          >
            <h2 id="report-title" className="text-lg font-semibold">
              Report this event
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tell us what looks wrong. Reports go to the platform admins, not the organiser.
            </p>
            <form onSubmit={submitReport} className="mt-4 space-y-3">
              {reportError && <Alert variant="error">{reportError}</Alert>}
              <div>
                <label htmlFor="reason" className="label">
                  Reason
                </label>
                <select id="reason" name="reason" required className="select" defaultValue="scam">
                  <option value="scam">Looks like a scam or fake event</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="misleading">Misleading details</option>
                  <option value="duplicate">Duplicate event</option>
                  <option value="other">Something else</option>
                </select>
              </div>
              <div>
                <label htmlFor="details" className="label">
                  Anything else? <span className="font-normal text-muted">(optional)</span>
                </label>
                <textarea id="details" name="details" maxLength={1000} className="textarea" placeholder="Add a short note for the admins" />
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={reportBusy}>
                  {reportBusy ? "Sending…" : "Send report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between rounded-2xl bg-page px-3 py-2 text-xs text-muted">
        <span>Ticket price</span>
        <PriceBadge ticketType={props.ticketType} price={props.price} />
      </div>
    </div>
  );
}
