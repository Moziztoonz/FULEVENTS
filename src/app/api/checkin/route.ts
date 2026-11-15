import { json, readJson, requireUser, route } from "@/lib/api";
import { checkInTicket } from "@/lib/ticketing";
import { checkInSchema } from "@/lib/validation";

export const POST = route(async (request) => {
  const user = await requireUser(["organizer", "admin"]);
  const input = checkInSchema.parse(await readJson(request));
  const result = checkInTicket(user, input.eventId, input.code);
  return json({ ok: true, ...result });
});
