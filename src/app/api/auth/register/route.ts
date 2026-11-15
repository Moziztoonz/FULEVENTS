import { randomUUID } from "node:crypto";
import { clientKey, HttpError, json, rateLimit, readJson, route } from "@/lib/api";
import { createSession } from "@/lib/auth";
import { get, run } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { hashPassword } from "@/lib/password";
import { digitsOnly, registerSchema } from "@/lib/validation";
import { nowISO } from "@/lib/utils";

export const POST = route(async (request) => {
  rateLimit(clientKey(request, "register"), 12, 10 * 60 * 1000);
  const input = registerSchema.parse(await readJson(request));

  const existing = get<{ id: string }>("SELECT id FROM users WHERE lower(email) = ?", input.email);
  if (existing) {
    throw new HttpError(409, "An account with this email already exists. Try logging in instead.", {
      email: "This email is already registered.",
    });
  }

  const id = randomUUID();
  const now = nowISO();
  const passwordHash = await hashPassword(input.password);

  run(
    `INSERT INTO users (id, full_name, email, phone, password_hash, role, organization_name,
       contact_phone, contact_email, is_blocked, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    id,
    input.fullName,
    input.email,
    input.phone ? digitsOnly(input.phone) : null,
    passwordHash,
    input.role,
    input.role === "organizer" ? input.organizationName : null,
    input.role === "organizer" && input.contactPhone ? digitsOnly(input.contactPhone) : null,
    input.role === "organizer" ? input.email : null,
    now,
    now,
  );

  notify(id, {
    type: "account",
    title: "Welcome to Campus Events",
    body:
      input.role === "organizer"
        ? "Your organiser account is ready. Create your first event whenever you like."
        : "Your account is ready. Save events you like and your tickets will live here.",
    link: input.role === "organizer" ? "/organizer/events/new" : "/events",
  });

  await createSession(id);

  return json(
    {
      ok: true,
      role: input.role,
      redirect: input.role === "organizer" ? "/organizer" : "/events",
    },
    201,
  );
});
