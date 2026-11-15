import { randomUUID } from "node:crypto";
import { HttpError, json, requireUser, route } from "@/lib/api";
import { run } from "@/lib/db";
import { eventInputSchema } from "@/lib/validation";
import { saveFlyer } from "@/lib/storage";
import { nowISO, todayISO } from "@/lib/utils";

function formString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
}

export const POST = route(async (request) => {
  const user = await requireUser(["organizer", "admin"]);
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

  const flyer = form.get("flyer");
  if (!(flyer instanceof File) || flyer.size === 0) {
    throw new HttpError(400, "Add a flyer image so students know what the event looks like.", {
      flyer: "A flyer is required.",
    });
  }

  let flyerName: string;
  try {
    flyerName = await saveFlyer(flyer);
  } catch (error) {
    throw new HttpError(400, (error as Error).message, { flyer: (error as Error).message });
  }

  const wantsPublish = formString(form, "action") === "publish";
  const status = wantsPublish ? "published" : "draft";
  const id = randomUUID();
  const now = nowISO();

  run(
    `INSERT INTO events (id, organizer_id, title, category, description, event_date, start_time, end_time,
      venue, flyer_path, ticket_type, price, capacity, registration_deadline, contact_type, contact_value,
      contact_phone, contact_email, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    user.id,
    input.title,
    input.category,
    input.description,
    input.eventDate,
    input.startTime,
    input.endTime,
    input.venue,
    flyerName,
    input.ticketType,
    input.ticketType === "paid" ? Math.round(Number(input.price)) : 0,
    input.capacity ? Number(input.capacity) : null,
    input.registrationDeadline || null,
    input.ticketType === "paid" ? input.contactType || null : null,
    input.ticketType === "paid" ? input.contactValue || null : null,
    input.contactPhone || null,
    input.contactEmail || null,
    status,
    now,
    now,
  );

  return json({ ok: true, id, status, eventDate: input.eventDate, today: todayISO() }, 201);
});
