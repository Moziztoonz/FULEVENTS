import type { Metadata } from "next";
import { ActionButton } from "@/components/ActionButton";
import { Icon } from "@/components/Icon";
import { listUsers } from "@/lib/admin";
import { requirePageUser } from "@/lib/page-auth";
import { cn, formatDate, initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requirePageUser(["admin"], "/admin/users");
  const { q } = await searchParams;
  const users = listUsers(q);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Accounts</p>
          <h1 className="mt-1 font-display text-3xl">Users</h1>
          <p className="mt-1 text-sm text-muted">{users.length} account{users.length === 1 ? "" : "s"} shown.</p>
        </div>
        <form action="/admin/users" method="get" className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Search users
          </label>
          <input id="q" name="q" defaultValue={q ?? ""} placeholder="Name, email or club" className="input py-1.5 text-sm sm:w-64" />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Icon name="search" size={15} /> Search
          </button>
        </form>
      </header>

      <ul className="space-y-2">
        {users.map((user) => (
          <li key={user.id} data-user-id={user.id} className="card flex flex-wrap items-center gap-3 p-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
              {initials(user.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
                <span className={cn("chip", user.role === "admin" ? "badge-blue" : user.role === "organizer" ? "badge-green" : "badge-neutral")}>
                  {user.role}
                </span>
                {Boolean(user.is_blocked) && <span className="chip badge-red">Suspended</span>}
              </div>
              <p className="truncate text-xs text-muted">
                {user.email}
                {user.organization_name ? ` · ${user.organization_name}` : ""}
              </p>
              <p className="text-xs text-muted">
                Joined {formatDate(user.created_at.slice(0, 10))} · {user.event_count} events · {user.ticket_count} tickets
              </p>
            </div>
            {user.role !== "admin" && user.id !== admin.id && (
              <ActionButton
                url={`/api/admin/users/${user.id}/block`}
                body={{ blocked: !user.is_blocked }}
                label={user.is_blocked ? "Restore access" : "Suspend"}
                variant={user.is_blocked ? "secondary" : "danger"}
                confirmText={
                  user.is_blocked
                    ? `Restore access for ${user.full_name}?`
                    : `Suspend ${user.full_name}? They will be signed out and unable to log in.`
                }
              />
            )}
          </li>
        ))}
      </ul>

      {users.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
          No accounts match that search.
        </p>
      )}
    </div>
  );
}
