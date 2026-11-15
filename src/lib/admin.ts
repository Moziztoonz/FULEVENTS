import { all } from "./db";
import type { EventRow } from "./types";
import { todayISO } from "./utils";

export interface AdminUserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  organization_name: string | null;
  is_blocked: number;
  created_at: string;
  event_count: number;
  ticket_count: number;
}

export function listUsers(search?: string): AdminUserRow[] {
  const term = `%${(search ?? "").replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const filtering = Boolean(search?.trim());
  return all<AdminUserRow>(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.organization_name, u.is_blocked, u.created_at,
       (SELECT COUNT(*) FROM events e WHERE e.organizer_id = u.id) AS event_count,
       (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id) AS ticket_count
     FROM users u
     ${filtering ? "WHERE u.full_name LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR COALESCE(u.organization_name,'') LIKE ? ESCAPE '\\'" : ""}
     ORDER BY u.is_blocked DESC, u.created_at DESC
     LIMIT 200`,
    ...(filtering ? [term, term, term] : []),
  );
}

export function listAdminEvents(): EventRow[] {
  return all<EventRow>(
    `SELECT e.*, u.full_name AS organizer_name, u.organization_name,
       (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status <> 'cancelled') AS registered_count,
       (SELECT COUNT(*) FROM check_ins c WHERE c.event_id = e.id) AS checked_in_count
     FROM events e JOIN users u ON u.id = e.organizer_id
     ORDER BY e.created_at DESC LIMIT 300`,
  );
}

export interface AdminReportRow {
  id: string;
  event_id: string;
  event_title: string;
  event_status: string;
  reporter_name: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export function listReports(status?: string): AdminReportRow[] {
  return all<AdminReportRow>(
    `SELECT r.id, r.event_id, e.title AS event_title, e.status AS event_status,
            u.full_name AS reporter_name, r.reason, r.details, r.status, r.created_at, r.resolved_at
       FROM reports r
       JOIN events e ON e.id = r.event_id
       LEFT JOIN users u ON u.id = r.reporter_id
      ${status && status !== "all" ? "WHERE r.status = ?" : ""}
      ORDER BY CASE r.status WHEN 'open' THEN 0 ELSE 1 END, r.created_at DESC
      LIMIT 200`,
    ...(status && status !== "all" ? [status] : []),
  );
}

export interface OutboxRow {
  id: string;
  to_email: string;
  subject: string;
  body: string;
  sent_at: string | null;
  created_at: string;
}

export function listOutbox(): OutboxRow[] {
  return all<OutboxRow>(
    "SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT 50",
  );
}

export function todayLabel(): string {
  return todayISO();
}
