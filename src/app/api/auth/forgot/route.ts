import { clientKey, json, rateLimit, readJson, route } from "@/lib/api";
import { get } from "@/lib/db";
import { env } from "@/lib/env";
import { createPasswordReset } from "@/lib/reset";
import type { UserRow } from "@/lib/types";
import { forgotSchema } from "@/lib/validation";

export const POST = route(async (request) => {
  rateLimit(clientKey(request, "forgot"), 6, 10 * 60 * 1000);
  const { email } = forgotSchema.parse(await readJson(request));

  const user = get<UserRow>("SELECT * FROM users WHERE lower(email) = ?", email);
  let resetUrl: string | null = null;

  if (user && !user.is_blocked) {
    resetUrl = createPasswordReset(user.id, user.email).resetUrl;
  }

  const revealLink = env.resetLinkMode === "display" && Boolean(resetUrl);

  return json({
    ok: true,
    resetUrl: revealLink ? resetUrl : null,
    message: revealLink
      ? "No email service is connected to this deployment yet, so your reset link is shown below."
      : "If that email is registered, a reset link has been created. Check your inbox, or ask an administrator for help.",
  });
});
