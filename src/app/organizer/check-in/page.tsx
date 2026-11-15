import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { listOrganizerEvents } from "@/lib/events";
import { requirePageUser } from "@/lib/page-auth";
import { formatDate, formatTime, isPastEvent } from "@/lib/utils";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInIndexPage() {
  const user = await requirePageUser(["organizer", "admin"], "/organizer/check-in");
  const events = listOrganizerEvents(user.id);
  const upcoming = events.filter((event) => !isPastEvent(event.event_date) && event.status !== "cancelled");
  const others = events.filter((event) => !upcoming.includes(event));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="eyebrow">At the gate</p>
        <h1 className="mt-1 font-display text-3xl">Ticket check-in</h1>
        <p className="mt-1.5 text-sm text-muted">
          Pick the event you are running, then scan tickets with your camera or type the code.
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState
          icon="scan"
          title="No events to check in"
          body="Create an event first. Once students register, their tickets can be checked in here."
          action={
            <Link href="/organizer/events/new" className="btn btn-primary">
              Create an event
            </Link>
          }
        />
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-bold tracking-wide text-muted uppercase">Upcoming</h2>
            <ul className="space-y-2">
              {(upcoming.length > 0 ? upcoming : others).map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/organizer/events/${event.id}/check-in`}
                    className="card flex items-center gap-3 p-3.5 hover:border-brand-ring"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark">
                      <Icon name="scan" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{event.title}</span>
                      <span className="block text-xs text-muted">
                        {formatDate(event.event_date)} · {formatTime(event.start_time)} · {event.venue}
                      </span>
                    </span>
                    <span className="chip badge-neutral shrink-0">{event.checked_in_count} in</span>
                    <Icon name="chevronRight" size={16} className="text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
