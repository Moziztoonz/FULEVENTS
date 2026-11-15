import { HttpError, json, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { assertEventOwner } from "@/lib/ticketing";
import { deleteFlyer, saveFlyer } from "@/lib/storage";
import { eventInputSchema } from "@/lib/validation";
import { getEventById } from "@/lib/events";
import { nowISO } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export const PATCH = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser(["organizer", "admin"]);
  const event = getEventById(id);
  if (!event) throw new HttpError(404, "We could not find that event.");
  assertEventOwner(event, user);

  const form = await request.formData();
  const input = eventInputSchema.parse({
    title: formString(form, "title"),
    category: formString(form, "category"),
    description: formString(form, "description"),
    eventDate: formString(form, "eventDate"),
    startTime: formString(form, "startTime"),
    endTime: formString(form, "endTime"),
    venue: formString(form, "venue"),
    ticketType: formString(form, "ticketType"),
    price: formString(form, "price"),
    capacity: formString(form, "capacity"),
    registrationDeadline: formString(form, "registrationDeadline"),
    contactType: formString(form, "contactType"),
    contactValue: formString(form, "contactValue"),
    contactPhone: formString(form, "contactPhone"),
    contactEmail: formString(form, "contactEmail"),
  });

  // Shrinking capacity below the number already registered would strand tickets.
  if (input.capacity) {
    const taken = Number(event.registered_count ?? 0);
    if (Number(input.capacity) < taken) {
      throw new HttpError(
        400,
        `You already have ${taken} registrations. Choose ${taken} or more tickets, or leave it empty.`,
        { capacity: `At least ${taken} tickets.` },
      );
    }
  }

  const flyer = form.get("flyer");
  let flyerPath = event.flyer_path;
  if (flyer instanceof File && flyer.size > 0) {
    try {
      flyerPath = await saveFlyer(flyer);
    } catch (error) {
      throw new HttpError(400, (error as Error).message, { flyer: (error as Error).message });
    }
  }

  run(
    `UPDATE events SET title = ?, category = ?, description = ?, event_date = ?, start_time = ?,
       end_time = ?, venue = ?, flyer_path = ?, ticket_type = ?, price = ?, capacity = ?,
       registration_deadline = ?, contact_type = ?, contact_value = ?, contact_phone = ?,
       contact_email = ?, updated_at = ?
     WHERE id = ?`,
    input.title,
    input.category,
    input.description,
    input.eventDate,
    input.startTime,
    input.endTime,
    input.venue,
    flyerPath,
    input.ticketType,
    input.ticketType === "paid" ? Math.round(Number(input.price)) : 0,
    input.capacity ? Number(input.capacity) : null,
    input.registrationDeadline || null,
    input.ticketType === "paid" ? input.contactType || null : null,
    input.ticketType === "paid" ? input.contactValue || null : null,
    input.contactPhone || null,
    input.contactEmail || null,
    nowISO(),
    id,
  );

  if (event.flyer_path && event.flyer_path !== flyerPath) {
    await deleteFlyer(event.flyer_path);
  }

  const updated = get<EventRow>("SELECT status FROM events WHERE id = ?", id);
  return json({ ok: true, id, status: updated?.status });
});

export const DELETE = route(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser(["organizer", "admin"]);
  const event = getEventById(id);
  if (!event) throw new HttpError(404, "We could not find that event.");
  assertEventOwner(event, user);

  run("DELETE FROM events WHERE id = ?", id);
  await deleteFlyer(event.flyer_path);
  return json({ ok: true });
});
