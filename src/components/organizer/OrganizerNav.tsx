"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon";

const links = [
  { href: "/organizer", label: "Overview", icon: "briefcase" },
  { href: "/organizer/events/new", label: "Create event", icon: "plus" },
  { href: "/organizer/check-in", label: "Check-in", icon: "scan" },
] as const;

export function OrganizerNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Organiser sections">
      {links.map((link) => {
        const active =
          link.href === "/organizer"
            ? pathname === "/organizer"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold",
              active ? "bg-brand text-white" : "bg-white text-ink-soft border border-line hover:border-brand-ring",
            )}
          >
            <Icon name={link.icon} size={15} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
