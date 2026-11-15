"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "../Icon";

const links = [
  { href: "/admin", label: "Overview", icon: "settings" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/events", label: "Events", icon: "calendar" },
  { href: "/admin/reports", label: "Reports", icon: "flag" },
  { href: "/admin/messages", label: "Messages", icon: "mail" },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Admin sections">
      {links.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold",
              active ? "bg-ink text-white" : "border border-line bg-white text-ink-soft hover:border-brand-ring",
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
