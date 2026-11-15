import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert } from "@/components/Alert";
import { EventStatusBadge, PriceBadge } from "@/components/Badges";
import { Icon } from "@/components/Icon";
import { AttendeeTable } from "@/components/organizer/AttendeeTable";
import { EventStatusControls } from "@/components/organizer/EventStatusControls";
import { StatCard } from "@/components/StatCard";
import { getEventById } from "@/lib/events";
import { requirePageUser } from "@/lib/page-auth";
import { eventAttendees } from "@/lib/ticketing";
import { categoryLabel, formatDate, formatTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Manage event" };

export default async function ManageEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const { id } = await params;
  const { published } = await searchParams;
  const user = await requirePageUser(["organizer", "admin"], `/organizer/events/${id}`);
  const event = getEventById(id);
  if (!event) notFound();
  if (event.organizer_id !== user.id && user.role !== "admin") redirect("/organizer");

  const attendees = eventAttendees(id);
  const active = attendees.filter((row) => row.status !== "cancelled");
  const capacityLeft =
    event.capacity === null ? null : Math.max(event.capacity - active.length, 0);

  return (
    <div className="space-y-5">
      <Link href="/organizer" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> Dashboard
      </Link>

      {published === "1" && (
        <Alert variant="success" title="Event published">
          It is live on the homepage now. Share the link with your group chats.
        </Alert>
      )}

      <header className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge status={event.status} />
              <PriceBadge ticketType={event.ticket_type} price={event.price} />
              <span className="chip badge-neutral">{categoryLabel(event.category)}</span>
            </div>
            <h1 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">{event.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {formatDate(event.event_date)} · {formatTime(event.start_time)}–{formatTime(event.end_time)} ·{" "}
              {event.venue}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/events/${event.id}`} className="btn btn-secondary btn-sm">
              <Icon name="external" size={14} /> View public page
            </Link>
            <Link href={`/organizer/events/${event.id}/edit`} className="btn btn-secondary btn-sm">
              <Icon name="edit" size={14} /> Edit
            </Link>
            <Link href={`/organizer/events/${event.id}/check-in`} className="btn btn-primary btn-sm">
              <Icon name="scan" size={14} /> Check-in
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatCard label="Registrations" value={active.length} icon="users" />
          <StatCard label="Confirmed" value={Number(event.confirmed_count ?? 0)} icon="check" tone="brand" />
          <StatCard label="Pending payment" value={Number(event.pending_count ?? 0)} icon="clock" tone="amber" />
          <StatCard
            label="Checked in"
            value={Number(event.checked_in_count ?? 0)}
            icon="ticket"
            tone="blue"
            hint={capacityLeft === null ? "No ticket limit" : `${capacityLeft} tickets left`}
          />
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <EventStatusControls
            eventId={event.id}
            eventTitle={event.title}
            status={event.status}
            registrationCount={active.length}
          />
        </div>
      </header>

      <section className="card p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Attendees</h2>
            <p className="text-sm text-muted">
              {event.ticket_type === "paid"
                ? "Confirm payments you received outside the platform."
                : "Free event. Tickets are confirmed automatically."}
            </p>
          </div>
        </div>
        <AttendeeTable eventId={event.id} ticketType={event.ticket_type} attendees={attendees} />
      </section>

      {event.ticket_type === "paid" && (
        <Alert variant="info" title="Payments happen off the platform">
          Students pay you directly using the contact details on your event. When you have received the
          money, come back here and mark that student as confirmed. The platform never holds funds.
        </Alert>
      )}
    </div>
  );
}
