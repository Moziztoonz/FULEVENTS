import { randomBytes, randomUUID } from "node:crypto";
import { all, get, run, transaction } from "./db";
import { HttpError } from "./errors";
import { getEventById, isRegistrationOpen, syncSoldOutState } from "./events";
import { notify } from "./notifications";
import type { EventRow, RegistrationRow, SessionUser } from "./types";
import { nowISO, priceLabel, todayISO } from "./utils";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Cryptographically random, human-safe ticket code: FUL-XXXX-XXXX */
export function generateTicketCode(): string {
  const bytes = randomBytes(9);
  let out = "";
  for (let index = 0; index < 8; index += 1) {
    out += CODE_ALPHABET[bytes[index] % CODE_ALPHABET.length];
  }
  return `FUL-${out.slice(0, 4)}-${out.slice(4)}`;
}

function uniqueTicketCode(): string {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateTicketCode();
    if (!get("SELECT 1 AS ok FROM registrations WHERE ticket_code = ?", code)) return code;
  }
  throw new HttpError(500, "Could not create a ticket code. Please try again.");
}

function countActiveRegistrations(eventId: string): number {
  const row = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND status <> 'cancelled'",
    eventId,
  );
  return Number(row?.count ?? 0);
}

export interface RegistrationResult {
  id: string;
  ticketCode: string;
  status: "confirmed" | "pending_payment";
}

export function registerForEvent(userId: string, eventId: string): RegistrationResult {
  return transaction(() => {
    const event = getEventById(eventId);
    if (!event) throw new HttpError(404, "We could not find that event.");

    const open = isRegistrationOpen(event);
    if (!open.open) throw new HttpError(400, open.reason ?? "Registration is closed.");

    const existing = get<{ id: string; status: string }>(
      `SELECT id, status FROM registrations
        WHERE user_id = ? AND event_id = ? AND status <> 'cancelled'`,
      userId,
      eventId,
    );
    if (existing) throw new HttpError(409, "You already have a ticket for this event.");

    // Capacity is re-read inside the write transaction, so two students
    // registering at the same moment cannot both take the last seat.
    if (event.capacity !== null && countActiveRegistrations(eventId) >= event.capacity) {
      run("UPDATE events SET status = 'sold_out', updated_at = ? WHERE id = ?", nowISO(), eventId);
      throw new HttpError(409, "Tickets are sold out.");
    }

    const id = randomUUID();
    const ticketCode = uniqueTicketCode();
    const status = event.ticket_type === "free" ? "confirmed" : "pending_payment";
    run(
      `INSERT INTO registrations (id, event_id, user_id, ticket_code, status, registered_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      eventId,
      userId,
      ticketCode,
      status,
      nowISO(),
    );

    notify(userId, {
      type: status === "confirmed" ? "ticket" : "registration",
      title: status === "confirmed" ? "You are in" : "Ticket reserved",
      body:
        status === "confirmed"
          ? `Your ticket for ${event.title} is ready. Show the QR code at the gate.`
          : `We saved you a spot at ${event.title}. Pay ${priceLabel("paid", event.price)} to the organiser, then they will confirm your ticket.`,
      link: `/tickets/${id}`,
    });

    syncSoldOutState(eventId);
    return { id, ticketCode, status };
  });
}

export function cancelRegistration(user: SessionUser, registrationId: string): void {
  transaction(() => {
    const row = get<RegistrationRow & { event_title: string; event_date: string; organizer_id: string }>(
      `SELECT r.*, e.title AS event_title, e.event_date, e.organizer_id
         FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = ?`,
      registrationId,
    );
    if (!row) throw new HttpError(404, "We could not find that ticket.");
    if (row.user_id !== user.id && user.role !== "admin") {
      throw new HttpError(403, "That ticket belongs to another student.");
    }
    if (row.status === "cancelled") throw new HttpError(400, "This registration is already cancelled.");
    const checkedIn = get("SELECT 1 AS ok FROM check_ins WHERE registration_id = ?", registrationId);
    if (checkedIn) {
      throw new HttpError(400, "This ticket was already used for check-in, so it cannot be cancelled.");
    }
    if (row.event_date < todayISO()) {
      throw new HttpError(400, "This event has already happened.");
    }

    run(
      "UPDATE registrations SET status = 'cancelled', cancelled_at = ? WHERE id = ?",
      nowISO(),
      registrationId,
    );
    syncSoldOutState(row.event_id);
    notify(row.user_id, {
      type: "cancellation",
      title: "Registration cancelled",
      body: `Your registration for ${row.event_title} was cancelled.`,
      link: `/events/${row.event_id}`,
    });
  });
}

export function setPaymentStatus(
  user: SessionUser,
  registrationId: string,
  status: "pending_payment" | "confirmed",
): RegistrationRow {
  return transaction(() => {
    const row = get<
      RegistrationRow & { event_title: string; organizer_id: string; ticket_type: string; event_date: string }
    >(
      `SELECT r.*, e.title AS event_title, e.organizer_id, e.ticket_type, e.event_date
         FROM registrations r JOIN events e ON e.id = r.event_id WHERE r.id = ?`,
      registrationId,
    );
    if (!row) throw new HttpError(404, "We could not find that registration.");
    if (row.organizer_id !== user.id && user.role !== "admin") {
      throw new HttpError(403, "You can only manage registrations for your own events.");
    }
    if (row.ticket_type !== "paid") {
      throw new HttpError(400, "Free events do not need payment confirmation.");
    }
    if (row.status === "cancelled") {
      throw new HttpError(400, "This registration was cancelled.");
    }
    run(
      `UPDATE registrations SET status = ?, payment_confirmed_at = ?
        WHERE id = ?`,
      status,
      status === "confirmed" ? nowISO() : null,
      registrationId,
    );
    notify(row.user_id, {
      type: "payment",
      title: status === "confirmed" ? "Payment confirmed" : "Payment marked as pending",
      body:
        status === "confirmed"
          ? `The organiser confirmed your payment for ${row.event_title}. Your ticket is ready.`
          : `The organiser marked your payment for ${row.event_title} as pending. Contact them if you have already paid.`,
      link: `/tickets/${row.id}`,
    });
    return get<RegistrationRow>("SELECT * FROM registrations WHERE id = ?", registrationId)!;
  });
}

export function normalizeTicketCode(raw: string): string {
  const value = raw.trim().toUpperCase().replace(/\s+/g, "");
  const match = value.match(/FUL-?([A-Z0-9]{4})-?([A-Z0-9]{4})/);
  if (match) return `FUL-${match[1]}-${match[2]}`;
  return value;
}

export interface CheckInResult {
  ticketCode: string;
  studentName: string;
  eventTitle: string;
  checkedInAt: string;
}

export function checkInTicket(user: SessionUser, eventId: string, rawCode: string): CheckInResult {
  return transaction(() => {
    const event = getEventById(eventId);
    if (!event) throw new HttpError(404, "We could not find that event.");
    if (event.organizer_id !== user.id && user.role !== "admin") {
      throw new HttpError(403, "Check-in is only available to the organiser of this event.");
    }
    if (event.status === "cancelled") throw new HttpError(400, "This event was cancelled.");

    const code = normalizeTicketCode(rawCode);
    if (!code) throw new HttpError(400, "Enter a ticket code.");

    const registration = get<
      RegistrationRow & { student_name: string; student_email: string; event_title: string }
    >(
      `SELECT r.*, u.full_name AS student_name, u.email AS student_email, e.title AS event_title
         FROM registrations r
         JOIN users u ON u.id = r.user_id
         JOIN events e ON e.id = r.event_id
        WHERE r.ticket_code = ?`,
      code,
    );
    if (!registration) {
      throw new HttpError(404, "No ticket matches that code. Check the code and try again.");
    }
    if (registration.event_id !== eventId) {
      throw new HttpError(400, "That ticket belongs to a different event.");
    }
    if (registration.status === "cancelled") {
      throw new HttpError(400, "That ticket was cancelled.");
    }
    if (registration.status === "pending_payment") {
      throw new HttpError(400, "Payment for this ticket is still pending. Confirm it before check-in.");
    }
    const existing = get<{ checked_in_at: string }>(
      "SELECT checked_in_at FROM check_ins WHERE registration_id = ?",
      registration.id,
    );
    if (existing) {
      throw new HttpError(409, "Ticket already used.");
    }

    const checkedInAt = nowISO();
    run(
      "INSERT INTO check_ins (id, registration_id, event_id, checked_in_by, checked_in_at) VALUES (?, ?, ?, ?, ?)",
      randomUUID(),
      registration.id,
      eventId,
      user.id,
      checkedInAt,
    );
    notify(registration.user_id, {
      type: "ticket",
      title: "Checked in",
      body: `You were checked in at ${registration.event_title}. Enjoy the event.`,
      link: `/tickets/${registration.id}`,
    });

    return {
      ticketCode: registration.ticket_code,
      studentName: registration.student_name,
      eventTitle: registration.event_title,
      checkedInAt,
    };
  });
}

export function listUserTickets(userId: string) {
  return all<RegistrationRow>(
    `SELECT r.*, e.title AS event_title, e.event_date, e.start_time, e.venue, e.ticket_type,
            e.price, e.flyer_path, e.status AS event_status,
            u.full_name AS organizer_name, u.organization_name,
            e.contact_type, e.contact_value, e.contact_phone,
            (SELECT c.checked_in_at FROM check_ins c WHERE c.registration_id = r.id) AS checked_in_at
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = e.organizer_id
      WHERE r.user_id = ?
      ORDER BY (r.status = 'cancelled') ASC, e.event_date DESC`,
    userId,
  );
}

export function getTicketForUser(userId: string, ticketId: string, isAdmin = false) {
  return get<RegistrationRow>(
    `SELECT r.*, e.title AS event_title, e.event_date, e.start_time, e.venue, e.ticket_type,
            e.price, e.flyer_path, e.status AS event_status,
            u.full_name AS organizer_name, u.organization_name, u.id AS organizer_id,
            e.contact_type, e.contact_value, e.contact_phone,
            (SELECT c.checked_in_at FROM check_ins c WHERE c.registration_id = r.id) AS checked_in_at
       FROM registrations r
       JOIN events e ON e.id = r.event_id
       JOIN users u ON u.id = e.organizer_id
      WHERE r.id = ? AND (r.user_id = ? OR ? = 1)`,
    ticketId,
    userId,
    isAdmin ? 1 : 0,
  );
}

export function eventAttendees(eventId: string): Array<{
  id: string;
  ticket_code: string;
  status: string;
  registered_at: string;
  payment_confirmed_at: string | null;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  checked_in_at: string | null;
}> {
  return all(
    `SELECT r.id, r.ticket_code, r.status, r.registered_at, r.payment_confirmed_at,
            u.full_name AS student_name, u.email AS student_email, u.phone AS student_phone,
            c.checked_in_at
       FROM registrations r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN check_ins c ON c.registration_id = r.id
      WHERE r.event_id = ?
      ORDER BY r.registered_at ASC`,
    eventId,
  );
}

export function recentCheckIns(eventId: string, limit = 8) {
  return all<{
    ticket_code: string;
    student_name: string;
    checked_in_at: string;
    checked_in_by_name: string;
  }>(
    `SELECT r.ticket_code, u.full_name AS student_name, c.checked_in_at, s.full_name AS checked_in_by_name
       FROM check_ins c
       JOIN registrations r ON r.id = c.registration_id
       JOIN users u ON u.id = r.user_id
       JOIN users s ON s.id = c.checked_in_by
      WHERE c.event_id = ?
      ORDER BY c.checked_in_at DESC
      LIMIT ?`,
    eventId,
    limit,
  );
}

export function assertEventOwner(event: EventRow, user: SessionUser) {
  if (event.organizer_id !== user.id && user.role !== "admin") {
    throw new HttpError(403, "This event belongs to another organiser.");
  }
}
