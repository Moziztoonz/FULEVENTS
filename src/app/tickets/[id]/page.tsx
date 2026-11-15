import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Alert } from "@/components/Alert";
import { PaymentBadge } from "@/components/Badges";
import { Icon } from "@/components/Icon";
import { TicketActions } from "@/components/TicketActions";
import { getCurrentUser } from "@/lib/auth";
import { contactHref, contactLabel } from "@/lib/contact";
import { qrDataUrl } from "@/lib/qr";
import { getTicketForUser } from "@/lib/ticketing";
import { formatDateLong, formatTime, isPastEvent, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Your ticket" };

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/tickets/${id}`);

  const ticket = getTicketForUser(user.id, id, user.role === "admin");
  if (!ticket) notFound();

  const qr = await qrDataUrl(ticket.ticket_code);
  const cancelled = ticket.status === "cancelled";
  const checkedIn = Boolean(ticket.checked_in_at);
  const past = ticket.event_date ? isPastEvent(ticket.event_date) : false;
  const buyHref = contactHref(ticket.contact_type, ticket.contact_value, ticket.event_title ?? "");

  return (
    <div className="container-page max-w-3xl py-6 sm:py-9">
      <Link href="/tickets" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <Icon name="chevronLeft" size={16} /> My tickets
      </Link>

      {isNew && ticket.status === "confirmed" && (
        <div className="mb-4">
          <Alert variant="success" title="You are registered">
            Your ticket is ready. It is also saved in My tickets.
          </Alert>
        </div>
      )}
      {isNew && ticket.status === "pending_payment" && (
        <div className="mb-4">
          <Alert variant="warning" title="Seat reserved">
            Pay the organiser to confirm your ticket. Payment is handled directly with them; the
            platform does not process payments.
          </Alert>
        </div>
      )}
      {cancelled && (
        <div className="mb-4">
          <Alert variant="error" title="This ticket is cancelled">
            It cannot be used for entry. You can register again if the event is still open.
          </Alert>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_16px_40px_-28px_rgba(16,36,27,0.5)]">
        <div className="relative bg-[linear-gradient(120deg,#0a5136,#0e6b45_55%,#167a53)] px-5 py-6 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold tracking-[0.15em] text-white/70 uppercase">
                Campus Events · FULAFIA
              </p>
              <h1 className="mt-1.5 font-display text-2xl leading-tight text-white sm:text-[2rem]">
                {ticket.event_title}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/85">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="calendar" size={15} /> {ticket.event_date ? formatDateLong(ticket.event_date) : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={15} /> {ticket.start_time ? formatTime(ticket.start_time) : ""}
                </span>
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
                <Icon name="pin" size={15} /> {ticket.venue}
              </p>
            </div>
            <span className="shrink-0 rounded-2xl bg-white/15 px-3 py-2 text-center backdrop-blur">
              <span className="block text-[0.6rem] font-bold tracking-wider text-white/70 uppercase">Tickets</span>
              <span className="block text-xl font-bold">01</span>
            </span>
          </div>
        </div>

        <div className="grid gap-6 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-8">
          <div className="space-y-4">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.12em] text-muted uppercase">Attendee</p>
              <p className="text-lg font-semibold text-ink">{ticket.student_name}</p>
              {ticket.student_email && <p className="text-sm text-muted">{ticket.student_email}</p>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <PaymentBadge status={ticket.status} />
              {checkedIn ? (
                <span className="chip badge-blue">
                  <Icon name="check" size={13} /> Checked in {ticket.checked_in_at ? relativeTime(ticket.checked_in_at) : ""}
                </span>
              ) : (
                <span className="chip badge-neutral">Not checked in yet</span>
              )}
              {past && !checkedIn && <span className="chip badge-neutral">Event has ended</span>}
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Registered</dt>
                <dd className="text-ink">{relativeTime(ticket.registered_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Organiser</dt>
                <dd className="text-ink">{ticket.organizer_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Category</dt>
                <dd className="text-ink">
                  {ticket.ticket_type === "free"
                    ? "Free ticket"
                    : `Paid ticket · ₦${Number(ticket.price).toLocaleString("en-NG")}`}
                </dd>
              </div>
            </dl>

            {ticket.status === "pending_payment" && (
              <div className="rounded-2xl border border-[#f2dfbd] bg-amber-soft/70 p-4 text-sm text-ink-soft">
                <p className="font-semibold text-amber">Payment pending</p>
                <p className="mt-1 leading-relaxed">
                  Payment is handled directly with the organiser. The platform does not process
                  payments. Contact them, pay, and they will confirm this ticket.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {buyHref && (
                    <a href={buyHref} target="_blank" rel="noopener noreferrer nofollow" className="btn btn-secondary btn-sm">
                      <Icon name="external" size={14} /> {contactLabel(ticket.contact_type)}
                    </a>
                  )}
                  {ticket.contact_phone && (
                    <a href={`tel:${ticket.contact_phone}`} className="btn btn-secondary btn-sm">
                      <Icon name="phone" size={14} /> Call organiser
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-start">
            <div className="rounded-2xl border border-line bg-white p-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code for ticket ${ticket.ticket_code}`} width={190} height={190} className="h-[190px] w-[190px]" />
            </div>
            <p className="mt-3 font-mono text-base font-bold tracking-wider text-brand-dark">{ticket.ticket_code}</p>
            <p className="mt-0.5 text-center text-xs text-muted">Show this at the entrance</p>
          </div>
        </div>

        <div className="border-t border-dashed border-line px-5 py-5 sm:px-8">
          <TicketActions
            ticketId={ticket.id}
            code={ticket.ticket_code}
            studentName={ticket.student_name ?? ""}
            eventTitle={ticket.event_title ?? ""}
            eventDate={ticket.event_date ?? ""}
            startTime={ticket.start_time ?? ""}
            venue={ticket.venue ?? ""}
            status={ticket.status}
            checkedIn={checkedIn}
            qrDataUrl={qr}
            canCancel
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Keep this ticket to yourself. Anyone with the QR code can use it once.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/events/${ticket.event_id}`} className="btn btn-secondary btn-sm">
          <Icon name="calendar" size={15} /> Event page
        </Link>
        <Link href="/events" className="btn btn-secondary btn-sm">
          <Icon name="search" size={15} /> Find more events
        </Link>
      </div>
    </div>
  );
}
