import { json, requireUser, route } from "@/lib/api";
import { cancelRegistration } from "@/lib/ticketing";

export const DELETE = route(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser();
  cancelRegistration(user, id);
  return json({ ok: true });
});
