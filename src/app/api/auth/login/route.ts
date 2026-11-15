import { clientKey, HttpError, json, rateLimit, readJson, route } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { get } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { UserRow } from "@/lib/types";
import { loginSchema } from "@/lib/validation";

export const POST = route(async (request) => {
  rateLimit(clientKey(request, "login"), 10, 5 * 60 * 1000);
  const input = loginSchema.parse(await readJson(request));

  const user = get<UserRow>("SELECT * FROM users WHERE lower(email) = ?", input.email);
  const valid = user ? await verifyPassword(input.password, user.password_hash) : false;

  if (!user || !valid) {
    throw new HttpError(401, "That email and password do not match. Please try again.");
  }
  if (user.is_blocked) {
    throw new HttpError(
      403,
      "This account has been suspended. Contact the platform administrator if you think this is a mistake.",
    );
  }

  await createSession(user.id);

  return json({
    ok: true,
    role: user.role,
    redirect: user.role === "organizer" ? "/organizer" : user.role === "admin" ? "/admin" : "/events",
  });
});
