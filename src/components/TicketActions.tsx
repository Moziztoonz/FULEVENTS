"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/client";
import { Alert } from "./Alert";
import { Icon } from "./Icon";

interface Props {
  ticketId: string;
  code: string;
  studentName: string;
  eventTitle: string;
  eventDate: string;
  startTime: string;
  venue: string;
  status: string;
  checkedIn: boolean;
  qrDataUrl: string;
  canCancel: boolean;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      cursorY += lineHeight;
      line = word;
      lines += 1;
      if (lines >= maxLines) {
        line = `${line.slice(0, 22)}…`;
        break;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cursorY);
    cursorY += lineHeight;
  }
  return cursorY;
}

export function TicketActions(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function downloadImage() {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1240;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0e6b45";
      ctx.fillRect(0, 0, canvas.width, 260);

      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "600 22px system-ui, sans-serif";
      ctx.fillText("CAMPUS EVENTS  ·  FULAFIA", 60, 74);

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 44px Georgia, serif";
      wrapText(ctx, props.eventTitle, 60, 140, canvas.width - 120, 54, 2);

      ctx.fillStyle = "#5c6b62";
      ctx.font = "600 20px system-ui, sans-serif";
      ctx.fillText("ATTENDEE", 60, 330);
      ctx.fillStyle = "#10241b";
      ctx.font = "700 34px system-ui, sans-serif";
      ctx.fillText(props.studentName, 60, 374);

      const details: Array<[string, string]> = [
        ["DATE", props.eventDate],
        ["TIME", props.startTime],
        ["VENUE", props.venue],
        [
          "STATUS",
          props.status === "confirmed" ? "Confirmed" : props.status === "pending_payment" ? "Pending payment" : "Cancelled",
        ],
      ];

      let y = 440;
      for (const [label, value] of details) {
        ctx.fillStyle = "#5c6b62";
        ctx.font = "600 20px system-ui, sans-serif";
        ctx.fillText(label, 60, y);
        ctx.fillStyle = "#10241b";
        ctx.font = "500 26px system-ui, sans-serif";
        y = wrapText(ctx, value, 220, y, canvas.width - 280, 32, 2) + 22;
      }

      const qr = new Image();
      await new Promise<void>((resolve, reject) => {
        qr.onload = () => resolve();
        qr.onerror = () => reject(new Error("QR image failed"));
        qr.src = props.qrDataUrl;
      });

      ctx.strokeStyle = "#dde6de";
      ctx.lineWidth = 3;
      ctx.strokeRect(250, 650, 400, 400);
      ctx.drawImage(qr, 260, 660, 380, 380);

      ctx.fillStyle = "#0a5136";
      ctx.font = "700 38px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(props.code, canvas.width / 2, 1110);

      ctx.fillStyle = "#5c6b62";
      ctx.font = "500 22px system-ui, sans-serif";
      ctx.fillText(
        props.checkedIn ? "Checked in. Enjoy the event." : "Show this code or the QR at the gate. One entry per ticket.",
        canvas.width / 2,
        1160,
      );
      ctx.textAlign = "left";

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Could not render ticket");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fulafia-ticket-${props.code}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMessage({ type: "success", text: "Ticket image saved to your downloads." });
    } catch {
      setMessage({ type: "error", text: "Sorry, we could not create the image. Try the PDF instead." });
    } finally {
      setBusy(false);
    }
  }

  async function shareTicket() {
    const url = `${window.location.origin}/tickets/${props.ticketId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `My ticket for ${props.eventTitle}`, url });
        return;
      } catch {
        // dismissed
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "info", text: "Ticket link copied. Only you can open it while signed in." });
    } catch {
      setMessage({ type: "info", text: url });
    }
  }

  async function cancel() {
    setBusy(true);
    const result = await sendJson(`/api/registrations/${props.ticketId}`, "DELETE");
    setBusy(false);
    setConfirming(false);
    if (!result.ok) {
      setMessage({ type: "error", text: result.data.error ?? "We could not cancel this ticket." });
      return;
    }
    setMessage({ type: "success", text: "Registration cancelled. The ticket is no longer valid." });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <a href={`/api/tickets/${props.ticketId}/pdf`} className="btn btn-primary" download>
          <Icon name="download" size={16} /> Download PDF
        </a>
        <button type="button" onClick={downloadImage} className="btn btn-secondary" disabled={busy}>
          <Icon name="download" size={16} /> Save as image
        </button>
        <button type="button" onClick={shareTicket} className="btn btn-secondary">
          <Icon name="share" size={16} /> Share ticket
        </button>
        {props.canCancel && !props.checkedIn && props.status !== "cancelled" && (
          <button type="button" onClick={() => setConfirming(true)} className="btn btn-danger">
            Cancel registration
          </button>
        )}
      </div>

      {message && <Alert variant={message.type}>{message.text}</Alert>}

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="cancel-title" className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <h2 id="cancel-title" className="text-lg font-semibold">
              Cancel this registration?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Your ticket for {props.eventTitle} will stop working. You can register again later if
              tickets are still available.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setConfirming(false)} disabled={busy}>
                Keep ticket
              </button>
              <button type="button" className="btn btn-danger flex-1" onClick={cancel} disabled={busy}>
                {busy ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
