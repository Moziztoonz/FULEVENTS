import { all, get } from "./db";
import { addDaysISO, todayISO } from "./utils";

export function publicStats() {
  const today = todayISO();
  const row = get<{ upcoming: number; free: number; this_week: number }>(
    `SELECT
       (SELECT COUNT(*) FROM events WHERE status IN ('published','sold_out') AND event_date >= ?) AS upcoming,
       (SELECT COUNT(*) FROM events WHERE status IN ('published','sold_out') AND event_date >= ? AND ticket_type = 'free') AS free,
       (SELECT COUNT(*) FROM events WHERE status IN ('published','sold_out') AND event_date >= ? AND event_date <= ?) AS this_week`,
    today,
    today,
    today,
    addDaysISO(today, 6),
  );
  return {
    upcoming: Number(row?.upcoming ?? 0),
    free: Number(row?.free ?? 0),
    thisWeek: Number(row?.this_week ?? 0),
  };
}

export function categoryCounts(): Record<string, number> {
  const rows = all<{ category: string; count: number }>(
    `SELECT category, COUNT(*) AS count FROM events
      WHERE status IN ('published','sold_out') AND event_date >= ?
      GROUP BY category`,
    todayISO(),
  );
  return Object.fromEntries(rows.map((row) => [row.category, Number(row.count)]));
}

export function organizerStats(organizerId: string) {
  const today = todayISO();
  const row = get<{
    total_events: number;
    published: number;
    registrations: number;
    confirmed: number;
    pending: number;
    capacity: number;
    checked_in: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM events WHERE organizer_id = ?) AS total_events,
      (SELECT COUNT(*) FROM events WHERE organizer_id = ? AND status IN ('published','sold_out') AND event_date >= ?) AS published,
      (SELECT COUNT(*) FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.organizer_id = ? AND r.status <> 'cancelled') AS registrations,
      (SELECT COUNT(*) FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.organizer_id = ? AND r.status = 'confirmed') AS confirmed,
      (SELECT COUNT(*) FROM registrations r JOIN events e ON e.id = r.event_id
        WHERE e.organizer_id = ? AND r.status = 'pending_payment') AS pending,
      (SELECT COALESCE(SUM(capacity), 0) FROM events WHERE organizer_id = ? AND ticket_type = 'free') AS capacity,
      (SELECT COUNT(*) FROM check_ins c JOIN events e ON e.id = c.event_id WHERE e.organizer_id = ?) AS checked_in`,
    organizerId,
    organizerId,
    today,
    organizerId,
    organizerId,
    organizerId,
    organizerId,
    organizerId,
  );

  const freeTaken = get<{ count: number }>(
    `SELECT COUNT(*) AS count FROM registrations r JOIN events e ON e.id = r.event_id
      WHERE e.organizer_id = ? AND e.ticket_type = 'free' AND r.status <> 'cancelled'`,
    organizerId,
  );

  const capacity = Number(row?.capacity ?? 0);
  const taken = Number(freeTaken?.count ?? 0);

  return {
    totalEvents: Number(row?.total_events ?? 0),
    published: Number(row?.published ?? 0),
    registrations: Number(row?.registrations ?? 0),
    confirmed: Number(row?.confirmed ?? 0),
    pending: Number(row?.pending ?? 0),
    checkedIn: Number(row?.checked_in ?? 0),
    availableTickets: Math.max(capacity - taken, 0),
  };
}

export function adminStats() {
  const today = todayISO();
  const row = get<{
    users: number;
    students: number;
    organizers: number;
    events: number;
    upcoming: number;
    registrations: number;
    open_reports: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE role = 'student') AS students,
      (SELECT COUNT(*) FROM users WHERE role = 'organizer') AS organizers,
      (SELECT COUNT(*) FROM events) AS events,
      (SELECT COUNT(*) FROM events WHERE event_date >= ? AND status IN ('published','sold_out')) AS upcoming,
      (SELECT COUNT(*) FROM registrations WHERE status <> 'cancelled') AS registrations,
      (SELECT COUNT(*) FROM reports WHERE status = 'open') AS open_reports`,
    today,
  );
  return {
    users: Number(row?.users ?? 0),
    students: Number(row?.students ?? 0),
    organizers: Number(row?.organizers ?? 0),
    events: Number(row?.events ?? 0),
    upcoming: Number(row?.upcoming ?? 0),
    registrations: Number(row?.registrations ?? 0),
    openReports: Number(row?.open_reports ?? 0),
  };
}
