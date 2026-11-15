import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { EventStatusBadge } from "@/components/Badges";
import { listAdminEvents } from "@/lib/admin";
import { requirePageUser } from "@/lib/page-auth";
import { categoryLabel, formatDate, formatNaira } from "@/lib/utils";

export const metadata: Metadata = { title: "Events" };

export default async function AdminEventsPage() {
  await requirePageUser(["admin"], "/admin/events");
  const events = listAdminEvents();

  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Moderation</p>
        <h1 className="mt-1 font-display text-3xl">All events</h1>
        <p className="mt-1 text-sm text-muted">
          Remove fraudulent events, feature good ones, or open an event to inspect it.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No events have been created yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="card p-3.5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-brand-soft">
                  {event.flyer_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/files/${event.flyer_path}`} alt="" loading="lazy" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link href={`/events/${event.id}`} className="truncate text-sm font-bold text-ink hover:underline">
                      {event.title}
                    </Link>
                    <EventStatusBadge status={event.status} />
                    {Boolean(event.featured) && <span className="chip badge-blue">Featured</span>}
                  </div>
                  <p className="text-xs text-muted">
                    {event.organization_name || event.organizer_name} · {categoryLabel(event.category)} ·{" "}
                    {formatDate(event.event_date)}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {event.ticket_type === "free" ? "Free" : formatNaira(event.price)} ·{" "}
                    {event.registered_count} registered
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    url={`/api/admin/events/${event.id}/feature`}
                    body={{ featured: !event.featured }}
                    label={event.featured ? "Unfeature" : "Feature"}
                    variant="secondary"
                  />
                  <Link href={`/organizer/events/${event.id}`} className="btn btn-secondary btn-sm">
                    Manage
                  </Link>
                  <ActionButton
                    url={`/api/events/${event.id}`}
                    method="DELETE"
                    label="Remove"
                    variant="danger"
                    confirmText={`Remove "${event.title}"? This deletes the event and all its tickets. This cannot be undone.`}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
