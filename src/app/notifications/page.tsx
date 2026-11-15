import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { MarkNotificationsRead } from "@/components/MarkNotificationsRead";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications, unreadCount } from "@/lib/notifications";
import { cn, relativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

const icons: Record<string, string> = {
  ticket: "ticket",
  registration: "ticket",
  payment: "check",
  cancellation: "alert",
  event: "calendar",
  report: "flag",
  account: "users",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notifications");

  const notifications = listNotifications(user.id, 50);
  const unread = unreadCount(user.id);

  return (
    <div className="container-page max-w-3xl py-6 sm:py-9">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Updates</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">Notifications</h1>
          <p className="mt-1.5 text-sm text-muted">
            {unread > 0 ? `${unread} unread` : "You are all caught up."}
          </p>
        </div>
        <MarkNotificationsRead hasUnread={unread > 0} />
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon="bell"
          title="No notifications yet"
          body="Ticket updates, payment confirmations and cancellations will show up here."
          action={
            <Link href="/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {notifications.map((item) => (
            <li key={item.id} className={cn("flex gap-3 p-4", !item.read_at && "bg-brand-soft/40")}>
              <span
                className={cn(
                  "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full",
                  item.read_at ? "bg-page text-muted" : "bg-brand text-white",
                )}
              >
                <Icon name={icons[item.type] ?? "bell"} size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <span className="text-xs text-muted">{relativeTime(item.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{item.body}</p>
                {item.link && (
                  <Link href={item.link} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-brand-dark hover:underline">
                    Open <Icon name="chevronRight" size={13} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
