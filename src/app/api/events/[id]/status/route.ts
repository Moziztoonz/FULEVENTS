import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { all, run } from "@/lib/db";
import { getEventById } from "@/lib/events";
import { notify } from "@/lib/notifications";
import { assertEventOwner } from "@/lib/ticketing";
import { nowISO, todayISO } from "@/lib/utils";

const schema = z.object({
  status: z.enum(["published", "draft", "sold_out", "cancelled"]),
});

export const POST = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser(["organizer", "admin"]);
  const event = getEventById(id);
  if (!event) throw new HttpError(404, "We could not find that event.");
  assertEventOwner(event, user);

  const { status } = schema.parse(await readJson(request));

  if (status === "published" || status === "sold_out") {
    if (!event.flyer_path) {
      throw new HttpError(400, "Add a flyer before publishing this event. Edit the event to upload one.");
    }
    if (event.event_date < todayISO()) {
      throw new HttpError(400, "This event date has passed, so it cannot be published.");
    }
  }

  run("UPDATE events SET status = ?, updated_at = ? WHERE id = ?", status, nowISO(), id);

  if (status === "cancelled" && event.status !== "cancelled") {
    const attendees = all<{ user_id: string }>(
      "SELECT user_id FROM registrations WHERE event_id = ? AND status <> 'cancelled'",
      id,
    );
    for (const attendee of attendees) {
      notify(attendee.user_id, {
        type: "event",
        title: "Event cancelled",
        body: `${event.title} was cancelled by the organiser. You no longer need your ticket.`,
        link: `/events/${id}`,
      });
    }
  }

  return json({ ok: true, status });
});
