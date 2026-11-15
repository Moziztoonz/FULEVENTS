import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventActions } from "@/components/EventActions";
import { CategoryPill, PriceBadge } from "@/components/Badges";
import { EventCard } from "@/components/EventCard";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";
import { getCurrentUser } from "@/lib/auth";
import { contactHref, contactLabel, formatPhone } from "@/lib/contact";
import {
  getEventById,
  getRegistrationFor,
  isBookmarked,
  isRegistrationOpen,
  listEvents,
  remainingCapacity,
} from "@/lib/events";
import { categoryLabel, formatDateLong, formatTime, isPastEvent } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description.slice(0, 160),
  };
}

export default async function EventDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === event.organizer_id;
  const isAdmin = user?.role === "admin";
  if (event.status === "draft" && !isOwner && !isAdmin) notFound();

  const registration = user ? getRegistrationFor(user.id, id) : undefined;
  const saved = user ? isBookmarked(user.id, id) : false;
  const open = isRegistrationOpen(event);
  const remaining = remainingCapacity(event);
  const isPast = isPastEvent(event.event_date);
  const buyHref = contactHref(event.contact_type, event.contact_value, event.title);

  const related = listEvents({ category: event.category, perPage: 4 }).items
    .filter((item) => item.id !== event.id)
    .slice(0, 3);

  return (
    <div className="container-page py-5 sm:py-8">
      <Link href="/events" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> All events
      </Link>

      {event.status === "cancelled" && (
        <div className="mb-4 rounded-2xl border border-[#f2cbc7] bg-danger-soft px-4 py-3 text-sm text-danger">
          <p className="font-semibold">This event was cancelled.</p>
          <p>If you already have a ticket, you do not need to do anything.</p>
        </div>
      )}
      {event.status === "sold_out" && (
        <div className="mb-4 rounded-2xl border border-[#f2dfbd] bg-amber-soft px-4 py-3 text-sm text-amber">
          <p className="font-semibold">Tickets are sold out.</p>
          <p>The organiser may release more, so check back later.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-brand-soft">
            {event.flyer_path ? (
              <img
                src={`/api/files/${event.flyer_path}`}
                alt={`Flyer for ${event.title}`}
                className="aspect-[16/9] w-full object-cover"
                fetchPriority="high"
              />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center text-brand-dark/40">
                <Icon name="calendar" size={48} />
              </div>
            )}
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
              <CategoryPill category={event.category} />
              <PriceBadge ticketType={event.ticket_type} price={event.price} />
            </div>
          </div>

          <header className="mt-5">
            <h1 className="font-display text-[2rem] leading-[1.1] sm:text-[2.6rem]">{event.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={16} className="text-brand" />
                {formatDateLong(event.event_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="clock" size={16} className="text-brand" />
                {formatTime(event.start_time)} – {formatTime(event.end_time)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="pin" size={16} className="text-brand" />
                {event.venue}
              </span>
            </div>
          </header>

          <section className="mt-6" aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-lg font-semibold">
              About this event
            </h2>
            <div className="prose-body mt-2 space-y-3">
              {event.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2" aria-label="Event facts">
            <div className="card p-4">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">Date and time</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">{formatDateLong(event.event_date)}</p>
              <p className="text-sm text-muted">
                {formatTime(event.start_time)} to {formatTime(event.end_time)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">Venue</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">{event.venue}</p>
              <p className="text-sm text-muted">Federal University of Lafia</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">Category</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">{categoryLabel(event.category)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs font-bold tracking-wide text-muted uppercase">Tickets</p>
              <p className="mt-1.5 text-sm font-semibold text-ink">
                {event.capacity === null
                  ? "No limit set"
                  : `${remaining} of ${event.capacity} left`}
              </p>
              {event.registration_deadline && (
                <p className="text-sm text-muted">
                  Registration closes {formatDateLong(event.registration_deadline)}
                </p>
              )}
            </div>
          </section>

          {event.ticket_type === "paid" && (
            <section className="mt-4 rounded-2xl border border-line bg-white p-4">
              <h2 className="text-sm font-bold text-ink">About payments</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Payment is handled directly with the organiser. This platform does not process
                payments and never asks for card details. Once the organiser confirms your payment,
                your ticket becomes valid for entry.
              </p>
              {(event.contact_phone || event.contact_email) && (
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  {event.contact_phone && (
                    <a href={`tel:+${formatPhone(event.contact_phone).replace(/\s/g, "")}`} className="btn btn-secondary btn-sm">
                      <Icon name="phone" size={15} /> {formatPhone(event.contact_phone)}
                    </a>
                  )}
                  {event.contact_email && (
                    <a href={`mailto:${event.contact_email}`} className="btn btn-secondary btn-sm">
                      <Icon name="mail" size={15} /> {event.contact_email}
                    </a>
                  )}
                </div>
              )}
            </section>
          )}

          <section className="mt-6 card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">
                {(event.organization_name || event.organizer_name || "?").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-muted uppercase">Organised by</p>
                <p className="truncate text-sm font-semibold text-ink">
                  {event.organization_name || event.organizer_name}
                </p>
                {event.organization_name && (
                  <p className="truncate text-xs text-muted">{event.organizer_name}</p>
                )}
              </div>
            </div>
          </section>
        </article>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-wide text-muted uppercase">Ticket</p>
                <p className="mt-0.5 text-xl font-semibold">
                  {event.ticket_type === "free" ? "Free entry" : `₦${event.price.toLocaleString("en-NG")}`}
                </p>
              </div>
              <PriceBadge ticketType={event.ticket_type} price={event.price} />
            </div>

            <p className="mt-2 text-sm text-muted">
              {event.capacity === null
                ? "Open to all FULAFIA students."
                : remaining === 0
                  ? "No tickets left."
                  : `${remaining} of ${event.capacity} tickets left.`}
            </p>

            <div className="mt-4">
              <EventActions
                eventId={event.id}
                eventTitle={event.title}
                eventStatus={event.status}
                ticketType={event.ticket_type}
                price={event.price}
                isLoggedIn={Boolean(user)}
                isOwner={Boolean(isOwner)}
                isSaved={saved}
                isPast={isPast}
                remaining={remaining}
                capacity={event.capacity}
                registrationDeadline={event.registration_deadline}
                open={open.open}
                closedReason={open.reason}
                existingTicket={
                  registration && registration.status !== "cancelled"
                    ? { id: registration.id, status: registration.status, ticketCode: registration.ticket_code }
                    : null
                }
                contactHref={buyHref}
                contactLabel={contactLabel(event.contact_type)}
                contactValue={event.contact_value}
              />
            </div>

            {isOwner && (
              <Link href={`/organizer/events/${event.id}`} className="btn btn-soft btn-block mt-3">
                <Icon name="settings" size={16} /> Manage this event
              </Link>
            )}
            {isAdmin && !isOwner && (
              <Link href="/admin/events" className="btn btn-soft btn-block mt-3">
                <Icon name="settings" size={16} /> Review in admin
              </Link>
            )}
          </div>

          <p className="mt-3 px-2 text-center text-xs leading-relaxed text-muted">
            Tickets are tied to your account. Screenshots do not check in, the QR code does.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <SectionHeading
            title={`More ${categoryLabel(event.category).toLowerCase()} events`}
            href={`/events?category=${event.category}`}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <EventCard key={item.id} event={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
