import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { nowISO } from "@/lib/utils";

const schema = z.object({ featured: z.boolean() });

export const POST = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await requireUser(["admin"]);
  const { featured } = schema.parse(await readJson(request));

  const event = get<{ id: string; status: string }>("SELECT id, status FROM events WHERE id = ?", id);
  if (!event) throw new HttpError(404, "We could not find that event.");
  if (featured && !["published", "sold_out"].includes(event.status)) {
    throw new HttpError(400, "Only published events can be featured.");
  }

  run("UPDATE events SET featured = ?, updated_at = ? WHERE id = ?", featured ? 1 : 0, nowISO(), id);
  return json({ ok: true, featured });
});
