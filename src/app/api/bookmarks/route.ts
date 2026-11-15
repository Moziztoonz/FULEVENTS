import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { nowISO } from "@/lib/utils";

const schema = z.object({ eventId: z.string().min(1) });

export const POST = route(async (request) => {
  const user = await requireUser();
  const { eventId } = schema.parse(await readJson(request));

  const event = get("SELECT id FROM events WHERE id = ?", eventId);
  if (!event) throw new HttpError(404, "We could not find that event.");

  const existing = get("SELECT 1 AS ok FROM bookmarks WHERE user_id = ? AND event_id = ?", user.id, eventId);
  if (existing) {
    run("DELETE FROM bookmarks WHERE user_id = ? AND event_id = ?", user.id, eventId);
    return json({ ok: true, saved: false });
  }

  run(
    "INSERT INTO bookmarks (user_id, event_id, created_at) VALUES (?, ?, ?)",
    user.id,
    eventId,
    nowISO(),
  );
  return json({ ok: true, saved: true });
});
