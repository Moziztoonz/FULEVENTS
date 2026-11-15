import { z } from "zod";
import { json, readJson, requireUser, route } from "@/lib/api";
import { setPaymentStatus } from "@/lib/ticketing";

const schema = z.object({ status: z.enum(["pending_payment", "confirmed"]) });

export const POST = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser(["organizer", "admin"]);
  const { status } = schema.parse(await readJson(request));
  const updated = setPaymentStatus(user, id, status);
  return json({ ok: true, status: updated.status, id: updated.id });
});
