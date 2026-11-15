import { z } from "zod";
import { json, readJson, requireUser, route } from "@/lib/api";
import { markAllRead, markRead } from "@/lib/notifications";

const schema = z.object({ id: z.string().min(1).optional() });

export const POST = route(async (request) => {
  const user = await requireUser();
  const { id } = schema.parse(await readJson(request).catch(() => ({})));
  if (id) markRead(user.id, id);
  else markAllRead(user.id);
  return json({ ok: true });
});
