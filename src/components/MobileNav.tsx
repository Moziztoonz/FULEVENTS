"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import type { Role } from "@/lib/types";

interface Item {
  href: string;
  label: string;
  icon: IconName;
}

function itemsFor(user: { role: Role } | null): Item[] {
  if (!user) {
    return [
      { href: "/", label: "Home", icon: "home" },
      { href: "/events", label: "Events", icon: "calendar" },
      { href: "/login", label: "Log in", icon: "users" },
    ];
  }
  if (user.role === "student") {
    return [
      { href: "/", label: "Home", icon: "home" },
      { href: "/events", label: "Events", icon: "calendar" },
      { href: "/tickets", label: "Tickets", icon: "ticket" },
      { href: "/saved", label: "Saved", icon: "bookmark" },
      { href: "/notifications", label: "Alerts", icon: "bell" },
    ];
  }
  if (user.role === "organizer") {
    return [
      { href: "/", label: "Home", icon: "home" },
      { href: "/events", label: "Events", icon: "calendar" },
      { href: "/tickets", label: "Tickets", icon: "ticket" },
      { href: "/organizer", label: "Dashboard", icon: "briefcase" },
      { href: "/notifications", label: "Alerts", icon: "bell" },
    ];
  }
  return [
    { href: "/", label: "Home", icon: "home" },
    { href: "/events", label: "Events", icon: "calendar" },
    { href: "/admin", label: "Admin", icon: "settings" },
    { href: "/notifications", label: "Alerts", icon: "bell" },
  ];
}

export function MobileNav({ user }: { user: { role: Role } | null }) {
  const pathname = usePathname();
  const items = itemsFor(user);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile"
    >
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2.5 text-[0.65rem] font-semibold",
                  active ? "text-brand-dark" : "text-muted",
                )}
              >
                <span className={cn("grid h-7 w-11 place-items-center rounded-full", active && "bg-brand-soft")}>
                  <Icon name={item.icon} size={19} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
