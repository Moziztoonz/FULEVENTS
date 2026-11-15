import { all, get, run } from "./db";
import type { EventRow, EventStatus, RegistrationRow } from "./types";
import { addDaysISO, nowISO, todayISO } from "./utils";

const EVENT_SELECT = `
  SELECT e.*, u.full_name AS organizer_name, u.organization_name, u.email AS organizer_email,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status <> 'cancelled') AS registered_count,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS confirmed_count,
    (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'pending_payment') AS pending_count,
    (SELECT COUNT(*) FROM check_ins c WHERE c.event_id = e.id) AS checked_in_count
  FROM events e JOIN users u ON u.id = e.organizer_id
`;

export type DateFilter = "upcoming" | "today" | "week" | "month" | "past";
export type PriceFilter = "all" | "free" | "paid";
export type SortOption = "soonest" | "newest";

export interface EventQuery {
  q?: string;
  category?: string;
  price?: PriceFilter;
  date?: DateFilter;
  sort?: SortOption;
  page?: number;
  perPage?: number;
  statuses?: EventStatus[];
}

export const PUBLIC_STATUSES: EventStatus[] = ["published", "sold_out"];

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

export function listEvents(query: EventQuery = {}): {
  items: EventRow[];
  total: number;
  page: number;
  pages: number;
} {
  const perPage = Math.min(Math.max(query.perPage ?? 12, 1), 48);
  const page = Math.max(query.page ?? 1, 1);
  const today = todayISO();
  const where: string[] = [];
  const params: Array<string | number> = [];

  const statuses = query.statuses ?? PUBLIC_STATUSES;
  where.push(`e.status IN (${statuses.map(() => "?").join(", ")})`);
  params.push(...statuses);

  if (query.q?.trim()) {
    const term = `%${escapeLike(query.q.trim())}%`;
    where.push(`(e.title LIKE ? ESCAPE '\\' OR e.description LIKE ? ESCAPE '\\'
      OR u.full_name LIKE ? ESCAPE '\\' OR COALESCE(u.organization_name, '') LIKE ? ESCAPE '\\')`);
    params.push(term, term, term, term);
  }

  if (query.category && query.category !== "all") {
    where.push("e.category = ?");
    params.push(query.category);
  }

  if (query.price === "free" || query.price === "paid") {
    where.push("e.ticket_type = ?");
    params.push(query.price);
  }

  switch (query.date ?? "upcoming") {
    case "today":
      where.push("e.event_date = ?");
      params.push(today);
      break;
    case "week":
      where.push("e.event_date >= ? AND e.event_date <= ?");
      params.push(today, addDaysISO(today, 6));
      break;
    case "month":
      where.push("e.event_date >= ? AND e.event_date <= ?");
      params.push(today, addDaysISO(today, 29));
      break;
    case "past":
      where.push("e.event_date < ?");
      params.push(today);
      break;
    default:
      where.push("e.event_date >= ?");
      params.push(today);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const order =
    query.sort === "newest"
      ? "ORDER BY e.created_at DESC"
      : "ORDER BY e.event_date ASC, e.start_time ASC";

  const totalRow = get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM events e JOIN users u ON u.id = e.organizer_id ${clause}`,
    ...(params as never[]),
  );
  const total = Number(totalRow?.count ?? 0);
  const pages = Math.max(Math.ceil(total / perPage), 1);
  const safePage = Math.min(page, pages);

  const items = all<EventRow>(
    `${EVENT_SELECT} ${clause} ${order} LIMIT ? OFFSET ?`,
    ...(params as never[]),
    perPage,
    (safePage - 1) * perPage,
  );

  return { items, total, page: safePage, pages };
}

export function getEventById(id: string): EventRow | undefined {
  return get<EventRow>(`${EVENT_SELECT} WHERE e.id = ?`, id);
}

export function getEventsByIds(ids: string[]): EventRow[] {
  if (ids.length === 0) return [];
  return all<EventRow>(
    `${EVENT_SELECT} WHERE e.id IN (${ids.map(() => "?").join(", ")})`,
    ...(ids as never[]),
  );
}

export function listSavedEvents(userId: string): EventRow[] {
  return all<EventRow>(
    `${EVENT_SELECT}
     WHERE e.id IN (SELECT event_id FROM bookmarks WHERE user_id = ?)
     ORDER BY e.event_date ASC`,
    userId,
  );
}

export function listOrganizerEvents(organizerId: string): EventRow[] {
  return all<EventRow>(
    `${EVENT_SELECT} WHERE e.organizer_id = ? ORDER BY e.event_date DESC, e.created_at DESC`,
    organizerId,
  );
}

export function listFeatured(limit = 3): EventRow[] {
  const today = todayISO();
  return all<EventRow>(
    `${EVENT_SELECT}
     WHERE e.status IN ('published', 'sold_out') AND e.featured = 1 AND e.event_date >= ?
     ORDER BY e.event_date ASC LIMIT ?`,
    today,
    limit,
  );
}

export function listPast(limit = 4): EventRow[] {
  return all<EventRow>(
    `${EVENT_SELECT}
     WHERE e.status IN ('published', 'sold_out') AND e.event_date < ?
     ORDER BY e.event_date DESC LIMIT ?`,
    todayISO(),
    limit,
  );
}

export function remainingCapacity(event: EventRow): number | null {
  if (event.capacity === null) return null;
  return Math.max(event.capacity - Number(event.registered_count ?? 0), 0);
}

export function isRegistrationOpen(event: EventRow): { open: boolean; reason?: string } {
  const today = todayISO();
  if (event.status === "cancelled") return { open: false, reason: "This event was cancelled." };
  if (event.status === "draft") return { open: false, reason: "This event is not open yet." };
  if (event.status === "sold_out") return { open: false, reason: "Tickets are sold out." };
  if (event.event_date < today) return { open: false, reason: "This event has already happened." };
  if (event.registration_deadline && event.registration_deadline < today) {
    return { open: false, reason: "Registration has closed." };
  }
  if (remainingCapacity(event) === 0) return { open: false, reason: "Tickets are sold out." };
  return { open: true };
}

export function getRegistrationFor(userId: string, eventId: string): RegistrationRow | undefined {
  return get<RegistrationRow>(
    "SELECT * FROM registrations WHERE user_id = ? AND event_id = ? AND status <> 'cancelled'",
    userId,
    eventId,
  );
}

export function isBookmarked(userId: string, eventId: string): boolean {
  return Boolean(
    get("SELECT 1 AS ok FROM bookmarks WHERE user_id = ? AND event_id = ?", userId, eventId),
  );
}

/** Flips published <-> sold_out so the public badge matches real capacity. */
export function syncSoldOutState(eventId: string): void {
  const event = get<EventRow>(
    `SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status <> 'cancelled') AS registered_count
       FROM events e WHERE e.id = ?`,
    eventId,
  );
  if (!event || event.status === "cancelled" || event.status === "draft") return;
  if (event.capacity === null) return;
  const full = Number(event.registered_count) >= event.capacity;
  if (full && event.status === "published") {
    run("UPDATE events SET status = 'sold_out', updated_at = ? WHERE id = ?", nowISO(), eventId);
  } else if (!full && event.status === "sold_out") {
    run("UPDATE events SET status = 'published', updated_at = ? WHERE id = ?", nowISO(), eventId);
  }
}

export function publicOrganizerProfile(organizerId: string) {
  return get<{
    id: string;
    full_name: string;
    organization_name: string | null;
    created_at: string;
    event_count: number;
  }>(
    `SELECT u.id, u.full_name, u.organization_name, u.created_at,
       (SELECT COUNT(*) FROM events e WHERE e.organizer_id = u.id AND e.status IN ('published','sold_out')) AS event_count
     FROM users u WHERE u.id = ? AND u.role IN ('organizer','admin')`,
    organizerId,
  );
}
