import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { get } from "@/lib/db";
import { getEventById, isRegistrationOpen } from "@/lib/events";
import { registerForEvent } from "@/lib/ticketing";

const schema = z.object({ eventId: z.string().min(1) });

export const POST = route(async (request) => {
  const user = await requireUser(["student", "organizer", "admin"]);
  const { eventId } = schema.parse(await readJson(request));

  const event = getEventById(eventId);
  if (!event) throw new HttpError(404, "We could not find that event.");
  if (event.organizer_id === user.id) {
    throw new HttpError(400, "You are the organiser of this event, so you do not need a ticket.");
  }
  const open = isRegistrationOpen(event);
  if (!open.open) throw new HttpError(400, open.reason ?? "Registration is closed.");

  const existing = get(
    "SELECT id FROM registrations WHERE event_id = ? AND user_id = ? AND status <> 'cancelled'",
    eventId,
    user.id,
  );
  if (existing) throw new HttpError(409, "You already have a ticket for this event.");

  const result = registerForEvent(user.id, eventId);
  return json({ ok: true, ticketId: result.id, ticketCode: result.ticketCode, status: result.status }, 201);
});
