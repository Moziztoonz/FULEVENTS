import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/notifications";
import { initials } from "@/lib/utils";
import { Brand } from "./Brand";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";

function homeFor(role: string) {
  if (role === "organizer") return "/organizer";
  if (role === "admin") return "/admin";
  return "/tickets";
}

const homeLabels: Record<string, string> = {
  organizer: "Dashboard",
  admin: "Admin",
  student: "My tickets",
};

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? unreadCount(user.id) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-page/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-7">
          <Brand />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Link href="/events" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white hover:text-ink">
              Events
            </Link>
            {user?.role === "student" && (
              <>
                <Link href="/tickets" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white hover:text-ink">
                  My tickets
                </Link>
                <Link href="/saved" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white hover:text-ink">
                  Saved
                </Link>
              </>
            )}
            {(user?.role === "organizer" || user?.role === "admin") && (
              <Link href="/organizer" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white hover:text-ink">
                Organiser
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" className="rounded-full px-3 py-2 text-sm font-semibold text-ink-soft hover:bg-white hover:text-ink">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/events"
            className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-white"
            aria-label="Search events"
          >
            <Icon name="search" size={19} />
          </Link>

          {user ? (
            <>
              <Link
                href="/notifications"
                className="relative grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-white"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              >
                <Icon name="bell" size={19} />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.6rem] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <Link
                href={homeFor(user.role)}
                className="hidden items-center gap-2 rounded-full border border-line bg-white py-1 pr-3 pl-1 text-sm font-semibold text-ink sm:flex"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
                  {initials(user.fullName)}
                </span>
                {homeLabels[user.role] ?? "Account"}
              </Link>
              <div className="hidden md:block">
                <LogoutButton compact />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link href="/login" className="btn btn-secondary btn-sm">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
