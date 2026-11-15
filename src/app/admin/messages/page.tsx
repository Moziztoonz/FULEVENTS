import type { Metadata } from "next";
import { Alert } from "@/components/Alert";
import { listOutbox } from "@/lib/admin";
import { requirePageUser } from "@/lib/page-auth";
import { relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Outbox" };

export default async function AdminMessagesPage() {
  await requirePageUser(["admin"], "/admin/messages");
  const messages = listOutbox();

  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Delivery</p>
        <h1 className="mt-1 font-display text-3xl">Message outbox</h1>
        <p className="mt-1 text-sm text-muted">
          Password reset messages land here until an email provider is connected.
        </p>
      </header>

      <Alert variant="info" title="Email delivery is not connected">
        No mail provider is configured in this deployment, so reset links are queued here. Students
        can still reset from the forgot password page while PASSWORD_RESET_DELIVERY=display. To send
        real email, connect a provider inside src/lib/reset.ts and mark messages as sent.
      </Alert>

      {messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          Nothing queued yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message) => (
            <li key={message.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{message.subject}</p>
                <span className="text-xs text-muted">{relativeTime(message.created_at)}</span>
              </div>
              <p className="text-xs text-muted">To: {message.to_email}</p>
              <pre className="mt-2 overflow-x-auto rounded-xl bg-page p-3 text-xs leading-relaxed whitespace-pre-wrap text-ink-soft">
                {message.body}
              </pre>
              <p className="mt-2 text-xs font-semibold text-amber">
                {message.sent_at ? `Sent ${relativeTime(message.sent_at)}` : "Not sent: no mail provider configured"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
