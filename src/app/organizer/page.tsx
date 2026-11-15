import type { Metadata } from "next";
import Link from "next/link";
import { EventStatusBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { StatCard } from "@/components/StatCard";
import { listOrganizerEvents } from "@/lib/events";
import { requirePageUser } from "@/lib/page-auth";
import { organizerStats } from "@/lib/stats";
import { formatDate, formatTime, isPastEvent } from "@/lib/utils";

export const metadata: Metadata = { title: "Organiser dashboard" };

export default async function OrganizerDashboard() {
  const user = await requirePageUser(["organizer", "admin"], "/organizer");
  const stats = organizerStats(user.id);
  const events = listOrganizerEvents(user.id);
  const upcoming = events.filter((event) => !isPastEvent(event.event_date));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Organiser</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            {user.organizationName || user.fullName}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted">
            Everything you need to run events: publish, track attendees, confirm payments and scan
            tickets at the gate.
          </p>
        </div>
        <Link href="/organizer/events/new" className="btn btn-primary">
          <Icon name="plus" size={17} /> Create event
        </Link>
      </header>

      <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total events" value={stats.totalEvents} icon="calendar" />
        <StatCard label="Published" value={stats.published} icon="check" tone="brand" hint="Upcoming and live" />
        <StatCard label="Registrations" value={stats.registrations} icon="users" />
        <StatCard label="Confirmed" value={stats.confirmed} icon="ticket" tone="brand" />
        <StatCard label="Pending payment" value={stats.pending} icon="clock" tone="amber" />
        <StatCard label="Available tickets" value={stats.availableTickets} icon="star" tone="blue" hint="Free events with limits" />
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title text-xl">Your events</h2>
          <p className="text-sm text-muted">
            {upcoming.length} upcoming · {events.length - upcoming.length} past
          </p>
        </div>

        {events.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No events yet"
            body="Create your first event. Add a flyer, set a date and publish. Students will see it on the homepage right away."
            action={
              <Link href="/organizer/events/new" className="btn btn-primary">
                Create your first event
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {events.map((event) => (
              <li key={event.id} className="card p-4">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                    {event.flyer_path ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/files/${event.flyer_path}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-brand-dark/40">
                        <Icon name="calendar" size={20} />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/organizer/events/${event.id}`} className="text-sm font-bold text-ink hover:text-brand-dark sm:text-base">
                        {event.title}
                      </Link>
                      <EventStatusBadge status={event.status} />
                      {isPastEvent(event.event_date) && <span className="chip badge-neutral">Past</span>}
                    </div>
                    <p className="mt-1 text-xs text-muted sm:text-sm">
                      {formatDate(event.event_date)} · {formatTime(event.start_time)} · {event.venue}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {event.registered_count} registered
                      {Number(event.pending_count) > 0 && ` · ${event.pending_count} awaiting payment`}
                      {Number(event.checked_in_count) > 0 && ` · ${event.checked_in_count} checked in`}
                      {event.capacity !== null && ` · ${event.capacity} capacity`}
                    </p>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <Link href={`/organizer/events/${event.id}`} className="btn btn-secondary btn-sm">
                      Manage
                    </Link>
                    <Link href={`/organizer/events/${event.id}/check-in`} className="btn btn-soft btn-sm">
                      <Icon name="scan" size={14} /> Check-in
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
