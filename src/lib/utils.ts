import type { Category, EventStatus, RegistrationStatus } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const LAGOS = "Africa/Lagos";

/** Today's date in West Africa Time as YYYY-MM-DD. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: LAGOS,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysISO(dateISO: string, days: number): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nowISO(): string {
  return new Date().toISOString();
}

function dateFromISO(dateISO: string): Date {
  const [y, m, d] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

export function formatDate(dateISO: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromISO(dateISO));
}

export function formatDateLong(dateISO: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateFromISO(dateISO));
}

export function formatDateShort(dateISO: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dateFromISO(dateISO));
}

/** "14:30" -> "2:30 PM" */
export function formatTime(time: string): string {
  const [hRaw, mRaw] = time.split(":");
  let h = Number(hRaw);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mRaw} ${suffix}`;
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function priceLabel(ticketType: string, price: number): string {
  return ticketType === "free" ? "Free" : formatNaira(price);
}

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(iso.slice(0, 10));
}

export const CATEGORIES: Array<{ value: Category; label: string; blurb: string; icon: string }> = [
  { value: "academic", label: "Academic", blurb: "Lectures, seminars, defences", icon: "book" },
  { value: "career", label: "Career", blurb: "Jobs, skills, internships", icon: "briefcase" },
  { value: "sports", label: "Sports", blurb: "Matches, races, fitness", icon: "ball" },
  { value: "entertainment", label: "Entertainment", blurb: "Concerts, shows, movie nights", icon: "music" },
  { value: "religious", label: "Religious", blurb: "Fellowships and prayer meetings", icon: "spark" },
  { value: "social", label: "Social", blurb: "Hangouts, dinners, meetups", icon: "users" },
  { value: "other", label: "Other", blurb: "Anything else on campus", icon: "star" },
];

export function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Unpublished",
  published: "Published",
  sold_out: "Sold out",
  cancelled: "Cancelled",
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export function isPastEvent(dateISO: string): boolean {
  return dateISO < todayISO();
}

export function isValidDate(dateISO: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) return false;
  const d = dateFromISO(dateISO);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === dateISO;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}
