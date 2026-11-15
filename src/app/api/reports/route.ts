import { randomUUID } from "node:crypto";
import { clientKey, HttpError, json, rateLimit, readJson, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { listAdmins, notify } from "@/lib/notifications";
import { reportSchema } from "@/lib/validation";
import { nowISO } from "@/lib/utils";

export const POST = route(async (request) => {
  const user = await requireUser();
  rateLimit(clientKey(request, `report:${user.id}`), 20, 60 * 60 * 1000);

  const input = reportSchema.parse(await readJson(request));
  const event = get<{ id: string; title: string }>("SELECT id, title FROM events WHERE id = ?", input.eventId);
  if (!event) throw new HttpError(404, "We could not find that event.");

  const already = get(
    "SELECT 1 AS ok FROM reports WHERE event_id = ? AND reporter_id = ? AND status = 'open'",
    event.id,
    user.id,
  );
  if (already) {
    throw new HttpError(409, "You already reported this event. The admins are looking into it.");
  }

  run(
    `INSERT INTO reports (id, event_id, reporter_id, reason, details, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?)`,
    randomUUID(),
    event.id,
    user.id,
    input.reason,
    input.details || null,
    nowISO(),
  );

  for (const admin of listAdmins()) {
    notify(admin.id, {
      type: "report",
      title: "New event report",
      body: `${user.fullName} reported "${event.title}" (${input.reason}).`,
      link: "/admin/reports",
    });
  }

  return json({ ok: true }, 201);
});
