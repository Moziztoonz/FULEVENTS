import type { Metadata } from "next";
import Link from "next/link";
import { EventStatusBadge } from "@/components/Badges";
import { Icon } from "@/components/Icon";
import { StatCard } from "@/components/StatCard";
import { listAdminEvents, listReports } from "@/lib/admin";
import { requirePageUser } from "@/lib/page-auth";
import { adminStats } from "@/lib/stats";
import { formatDate, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverviewPage() {
  await requirePageUser(["admin"], "/admin");
  const stats = adminStats();
  const reports = listReports("open").slice(0, 5);
  const events = listAdminEvents().slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Admin</p>
        <h1 className="mt-1 font-display text-3xl">Platform overview</h1>
        <p className="mt-1.5 text-sm text-muted">
          Accounts, events and reports in one place. Act on anything that looks wrong.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Platform numbers">
        <StatCard label="Users" value={stats.users} icon="users" />
        <StatCard label="Students" value={stats.students} icon="users" />
        <StatCard label="Organisers" value={stats.organizers} icon="briefcase" />
        <StatCard label="Events" value={stats.events} icon="calendar" />
        <StatCard label="Registrations" value={stats.registrations} icon="ticket" tone="brand" />
        <StatCard label="Open reports" value={stats.openReports} icon="flag" tone="amber" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Open reports</h2>
            <Link href="/admin/reports" className="text-sm font-semibold text-brand-dark hover:underline">
              All reports
            </Link>
          </div>
          {reports.length === 0 ? (
            <p className="mt-3 rounded-2xl bg-page px-4 py-6 text-center text-sm text-muted">
              Nothing reported. That is a good sign.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {reports.map((report) => (
                <li key={report.id} className="py-2.5">
                  <p className="text-sm font-semibold text-ink">{report.event_title}</p>
                  <p className="text-xs text-muted">
                    {report.reason} · reported by {report.reporter_name ?? "a removed account"} ·{" "}
                    {relativeTime(report.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest events</h2>
            <Link href="/admin/events" className="text-sm font-semibold text-brand-dark hover:underline">
              All events
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {events.map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <Link href={`/events/${event.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">
                    {event.title}
                  </Link>
                  <p className="truncate text-xs text-muted">
                    {event.organization_name || event.organizer_name} · {formatDate(event.event_date)}
                  </p>
                </div>
                <EventStatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="text-lg font-semibold">Moderation tips</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li className="flex gap-2">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
            Suspend accounts that post fake paid events, then remove the events.
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
            Removing an event cancels every ticket attached to it. Students keep a record in My tickets.
          </li>
          <li className="flex gap-2">
            <Icon name="check" size={16} className="mt-0.5 shrink-0 text-brand" />
            Feature strong events on the homepage with the star button under Events.
          </li>
        </ul>
      </section>
    </div>
  );
}
