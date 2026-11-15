import { clientKey, HttpError, json, rateLimit, readJson, route } from "@/lib/api";
import { revokeUserSessions } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { hashPassword } from "@/lib/password";
import { consumePasswordReset, markResetUsed } from "@/lib/reset";
import { resetSchema } from "@/lib/validation";
import { nowISO } from "@/lib/utils";

export const POST = route(async (request) => {
  rateLimit(clientKey(request, "reset"), 10, 10 * 60 * 1000);
  const input = resetSchema.parse(await readJson(request));

  const reset = consumePasswordReset(input.token);
  if (!reset) {
    throw new HttpError(400, "This reset link has expired or was already used. Request a new one.");
  }

  const passwordHash = await hashPassword(input.password);
  run("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", passwordHash, nowISO(), reset.userId);
  markResetUsed(input.token);
  revokeUserSessions(reset.userId);

  const user = get<{ full_name: string }>("SELECT full_name FROM users WHERE id = ?", reset.userId);
  notify(reset.userId, {
    type: "account",
    title: "Password changed",
    body: `Hi ${user?.full_name ?? "there"}, your password was changed. You have been signed out on all devices.`,
    link: "/login",
  });

  return json({ ok: true });
});
