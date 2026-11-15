import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert } from "@/components/Alert";
import { Icon } from "@/components/Icon";
import { CheckInPanel } from "@/components/organizer/CheckInPanel";
import { getEventById } from "@/lib/events";
import { requirePageUser } from "@/lib/page-auth";
import { recentCheckIns } from "@/lib/ticketing";
import { formatDate, formatTime, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Check-in" };

export default async function EventCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(["organizer", "admin"], `/organizer/events/${id}/check-in`);
  const event = getEventById(id);
  if (!event) notFound();
  if (event.organizer_id !== user.id && user.role !== "admin") redirect("/organizer");

  const recent = recentCheckIns(id, 8);

  return (
    <div className="space-y-4">
      <Link
        href={`/organizer/events/${id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <Icon name="chevronLeft" size={16} /> Back to event
      </Link>

      <header>
        <p className="eyebrow">Check-in</p>
        <h1 className="mt-1 font-display text-2xl leading-tight sm:text-3xl">{event.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {formatDate(event.event_date)} · {formatTime(event.start_time)} · {event.venue}
        </p>
      </header>

      {event.status === "cancelled" && (
        <Alert variant="error" title="This event is cancelled">
          Check-in is disabled because the event was cancelled.
        </Alert>
      )}
      {event.status === "draft" && (
        <Alert variant="warning" title="This event is not published">
          Tickets can still be checked in, but students cannot see the event page yet.
        </Alert>
      )}

      <CheckInPanel eventId={event.id} eventTitle={event.title} />

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest check-ins</h2>
          <span className="chip badge-green">{event.checked_in_count} of {event.registered_count}</span>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No one has checked in yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((row) => (
              <li key={`${row.ticket_code}-${row.checked_in_at}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{row.student_name}</p>
                  <p className="font-mono text-xs text-muted">{row.ticket_code}</p>
                </div>
                <p className="shrink-0 text-xs text-muted">{relativeTime(row.checked_in_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
