import { z } from "zod";
import { HttpError, json, readJson, requireUser, route } from "@/lib/api";
import { get, run } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { nowISO } from "@/lib/utils";
import type { UserRow } from "@/lib/types";

const schema = z.object({ blocked: z.boolean() });

export const POST = route(async (request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const admin = await requireUser(["admin"]);
  const { blocked } = schema.parse(await readJson(request));

  const target = get<UserRow>("SELECT * FROM users WHERE id = ?", id);
  if (!target) throw new HttpError(404, "We could not find that account.");
  if (target.id === admin.id) throw new HttpError(400, "You cannot block your own account.");
  if (target.role === "admin") throw new HttpError(400, "Administrator accounts cannot be blocked.");

  run("UPDATE users SET is_blocked = ?, updated_at = ? WHERE id = ?", blocked ? 1 : 0, nowISO(), id);

  if (blocked) {
    run("DELETE FROM sessions WHERE user_id = ?", id);
    notify(id, {
      type: "account",
      title: "Your account was suspended",
      body: "An administrator suspended this account. Contact the platform team if you think this is a mistake.",
    });
  } else {
    notify(id, {
      type: "account",
      title: "Your account was restored",
      body: "An administrator restored your account. You can log in again.",
    });
  }

  return json({ ok: true, blocked });
});
