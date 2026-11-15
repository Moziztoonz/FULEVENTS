import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { nowISO } from "@/lib/utils";

const schema = z.object({ status: z.enum(["open", "reviewed", "dismissed"]) });

export const POST = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const admin = await requireUser(["admin"]);
  const { status } = schema.parse(await readJson(request));

  const report = get("SELECT id FROM reports WHERE id = ?", id);
  if (!report) throw new HttpError(404, "We could not find that report.");

  run(
    "UPDATE reports SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?",
    status,
    status === "open" ? null : nowISO(),
    status === "open" ? null : admin.id,
    id,
  );
  return json({ ok: true, status });
});
