import type { Metadata } from "next";
import Link from "next/link";
import { ActionButton } from "@/components/ActionButton";
import { listReports } from "@/lib/admin";
import { requirePageUser } from "@/lib/page-auth";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Event reports" };

const reasonLabels: Record<string, string> = {
  scam: "Possible scam",
  inappropriate: "Inappropriate content",
  misleading: "Misleading details",
  duplicate: "Duplicate event",
  other: "Other",
};

const filters = [
  { value: "open", label: "Open" },
  { value: "reviewed", label: "Reviewed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePageUser(["admin"], "/admin/reports");
  const { status } = await searchParams;
  const active = status ?? "open";
  const reports = listReports(active);

  return (
    <div className="space-y-4">
      <header>
        <p className="eyebrow">Safety</p>
        <h1 className="mt-1 font-display text-3xl">Reported events</h1>
        <p className="mt-1 text-sm text-muted">
          Students report suspicious events. Review each one, then remove the event or close the report.
        </p>
      </header>

      <nav className="flex flex-wrap gap-1.5" aria-label="Report filters">
        {filters.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/reports?status=${filter.value}`}
            aria-current={active === filter.value ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              active === filter.value ? "bg-ink text-white" : "bg-white text-ink-soft border border-line",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {reports.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No {active === "all" ? "" : active} reports.
        </p>
      ) : (
        <ul className="space-y-2">
          {reports.map((report) => (
            <li key={report.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="chip badge-amber">{reasonLabels[report.reason] ?? report.reason}</span>
                    <span className={cn("chip", report.status === "open" ? "badge-red" : "badge-neutral")}>
                      {report.status}
                    </span>
                  </div>
                  <Link href={`/events/${report.event_id}`} className="mt-1.5 block truncate text-sm font-bold text-ink hover:underline">
                    {report.event_title}
                  </Link>
                  <p className="text-xs text-muted">
                    Reported by {report.reporter_name ?? "a removed account"} · {relativeTime(report.created_at)}
                  </p>
                  {report.details && <p className="mt-1.5 rounded-xl bg-page px-3 py-2 text-sm text-ink-soft">{report.details}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/organizer/events/${report.event_id}`} className="btn btn-secondary btn-sm">
                    Open event
                  </Link>
                  {report.status !== "reviewed" && (
                    <ActionButton
                      url={`/api/admin/reports/${report.id}`}
                      body={{ status: "reviewed" }}
                      label="Mark reviewed"
                      variant="primary"
                    />
                  )}
                  {report.status !== "dismissed" && (
                    <ActionButton
                      url={`/api/admin/reports/${report.id}`}
                      body={{ status: "dismissed" }}
                      label="Dismiss"
                      variant="secondary"
                      confirmText="Dismiss this report? The event stays live."
                    />
                  )}
                  {report.status !== "open" && (
                    <ActionButton
                      url={`/api/admin/reports/${report.id}`}
                      body={{ status: "open" }}
                      label="Reopen"
                      variant="secondary"
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
