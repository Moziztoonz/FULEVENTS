import { cn, categoryLabel, formatNaira } from "@/lib/utils";
import type { EventStatus, RegistrationStatus } from "@/lib/types";
import { Icon } from "./Icon";

export function PriceBadge({
  ticketType,
  price,
  className,
}: {
  ticketType: string;
  price: number;
  className?: string;
}) {
  const free = ticketType === "free";
  return (
    <span
      className={cn(
        "chip",
        free ? "badge-green" : "bg-ink text-white",
        className,
      )}
    >
      {free ? "Free" : formatNaira(price)}
    </span>
  );
}

const eventStatusStyles: Record<EventStatus, string> = {
  draft: "badge-neutral",
  published: "badge-green",
  sold_out: "badge-amber",
  cancelled: "badge-red",
};

const eventStatusText: Record<EventStatus, string> = {
  draft: "Unpublished",
  published: "Published",
  sold_out: "Sold out",
  cancelled: "Cancelled",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return <span className={cn("chip", eventStatusStyles[status])}>{eventStatusText[status]}</span>;
}

export function PaymentBadge({ status }: { status: RegistrationStatus }) {
  if (status === "confirmed") {
    return (
      <span className="chip badge-green">
        <Icon name="check" size={13} /> Payment confirmed
      </span>
    );
  }
  if (status === "cancelled") return <span className="chip badge-neutral">Cancelled</span>;
  return (
    <span className="chip badge-amber">
      <Icon name="clock" size={13} /> Pending payment
    </span>
  );
}

export function CategoryPill({ category, className }: { category: string; className?: string }) {
  return (
    <span className={cn("chip bg-white/90 text-ink backdrop-blur", className)}>
      {categoryLabel(category)}
    </span>
  );
}
