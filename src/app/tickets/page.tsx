import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PaymentBadge } from "@/components/Badges";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { getCurrentUser } from "@/lib/auth";
import { listUserTickets } from "@/lib/ticketing";
import { formatDate, formatTime, isPastEvent } from "@/lib/utils";

export const metadata: Metadata = { title: "My tickets" };

export default async function TicketsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/tickets");

  const tickets = listUserTickets(user.id);
  const active = tickets.filter(
    (ticket) => ticket.status !== "cancelled" && (!ticket.event_date || !isPastEvent(ticket.event_date)),
  );
  const past = tickets.filter(
    (ticket) => ticket.status === "cancelled" || (ticket.event_date && isPastEvent(ticket.event_date)),
  );

  return (
    <div className="container-page max-w-4xl py-6 sm:py-9">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your pocket</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">My tickets</h1>
          <p className="mt-1.5 text-sm text-muted">
            {active.length > 0
              ? `${active.length} ${active.length === 1 ? "ticket" : "tickets"} ready for upcoming events.`
              : "Tickets you register for will appear here."}
          </p>
        </div>
        <Link href="/events" className="btn btn-primary btn-sm">
          <Icon name="search" size={15} /> Find events
        </Link>
      </header>

      {tickets.length === 0 ? (
        <EmptyState
          icon="ticket"
          title="No tickets yet"
          body="When you register for a free event, or reserve a seat at a paid one, the ticket lands here."
          action={
            <Link href="/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {active.length > 0 && (
            <section aria-labelledby="active-heading">
              <h2 id="active-heading" className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                Upcoming
              </h2>
              <ul className="space-y-3">
                {active.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="card flex items-center gap-3 p-3 transition-shadow hover:shadow-md sm:gap-4 sm:p-4"
                    >
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft sm:h-24 sm:w-28">
                        {ticket.flyer_path ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`/api/files/${ticket.flyer_path}`}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-brand-dark/40">
                            <Icon name="calendar" size={22} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold text-ink sm:text-base">{ticket.event_title}</p>
                        <p className="mt-0.5 text-xs text-muted sm:text-sm">
                          {ticket.event_date ? formatDate(ticket.event_date) : ""} ·{" "}
                          {ticket.start_time ? formatTime(ticket.start_time) : ""}
                        </p>
                        <p className="truncate text-xs text-muted">{ticket.venue}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <PaymentBadge status={ticket.status} />
                          {ticket.checked_in_at && <span className="chip badge-blue">Checked in</span>}
                        </div>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-mono text-xs font-semibold text-ink-soft">{ticket.ticket_code}</p>
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark">
                          Open <Icon name="chevronRight" size={14} />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">
                Past and cancelled
              </h2>
              <ul className="space-y-3">
                {past.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white/60 p-3 hover:bg-white"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-page text-muted">
                        <Icon name="ticket" size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink-soft">{ticket.event_title}</p>
                        <p className="text-xs text-muted">
                          {ticket.event_date ? formatDate(ticket.event_date) : ""}
                          {ticket.status === "cancelled" ? " · Cancelled" : ticket.checked_in_at ? " · Attended" : " · Event ended"}
                        </p>
                      </div>
                      <Icon name="chevronRight" size={16} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
