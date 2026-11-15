import Link from "next/link";
import type { EventRow } from "@/lib/types";
import { categoryLabel, formatDateShort, formatTime, todayISO } from "@/lib/utils";
import { Icon } from "./Icon";
import { PriceBadge } from "./Badges";

export function EventCard({ event, priority = false }: { event: EventRow; priority?: boolean }) {
  const isPast = event.event_date < todayISO();
  const remaining =
    event.capacity === null ? null : Math.max(event.capacity - Number(event.registered_count ?? 0), 0);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-shadow hover:shadow-[0_12px_32px_-18px_rgba(16,36,27,0.35)]">
      <Link href={`/events/${event.id}`} className="flex h-full flex-col">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-soft">
          {event.flyer_path ? (
            <img
              src={`/api/files/${event.flyer_path}`}
              alt={`Flyer for ${event.title}`}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-brand-dark/50">
              <Icon name="calendar" size={34} />
            </div>
          )}

          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink/35 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span className="rounded-xl bg-white px-2.5 py-1 text-center shadow-sm">
              <span className="block text-[0.6rem] font-bold tracking-wider text-brand uppercase">
                {formatDateShort(event.event_date).split(" ")[1]}
              </span>
              <span className="block text-lg leading-none font-bold text-ink">
                {formatDateShort(event.event_date).split(" ")[0]}
              </span>
            </span>
            <PriceBadge ticketType={event.ticket_type} price={event.price} className="shadow-sm" />
          </div>

          {(event.status === "cancelled" || event.status === "sold_out" || isPast) && (
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/85 to-transparent px-3 pt-8 pb-2.5">
              <span className="chip bg-white/95 text-ink">
                {isPast ? "Past event" : event.status === "cancelled" ? "Cancelled" : "Sold out"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="text-[0.7rem] font-semibold tracking-wide text-brand uppercase">
            {categoryLabel(event.category)}
          </span>
          <h3 className="font-sans text-[1.02rem] leading-snug font-bold text-ink group-hover:text-brand-dark">
            {event.title}
          </h3>
          <div className="mt-auto space-y-1 pt-1 text-sm text-muted">
            <p className="flex items-center gap-1.5">
              <Icon name="calendar" size={15} className="shrink-0 text-brand" />
              <span className="truncate">
                {formatDateShort(event.event_date)} · {formatTime(event.start_time)}
              </span>
            </p>
            <p className="flex items-center gap-1.5">
              <Icon name="pin" size={15} className="shrink-0 text-brand" />
              <span className="truncate">{event.venue}</span>
            </p>
          </div>
          {remaining !== null && remaining <= 20 && !isPast && event.status !== "cancelled" && (
            <p className="text-xs font-semibold text-amber">
              {remaining === 0 ? "No tickets left" : `Only ${remaining} tickets left`}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
