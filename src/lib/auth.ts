import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { get, run } from "./db";
import { SESSION_COOKIE, SESSION_DAYS } from "./session-cookie";
import type { SessionUser, UserRow } from "./types";
import { nowISO } from "./utils";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    organizationName: row.organization_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
  };
}

/** Reads the signed-in user from the session cookie. Blocked users get null. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = get<UserRow & { expires_at: string; session_token: string }>(
    `SELECT u.*, s.expires_at, s.token_hash AS session_token
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`,
    hashToken(token),
  );
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token));
    return null;
  }
  if (row.is_blocked) return null;
  return toSessionUser(row);
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  run(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    hashToken(token),
    userId,
    expires.toISOString(),
    nowISO(),
  );
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    run("DELETE FROM sessions WHERE token_hash = ?", hashToken(token));
  }
  jar.delete(SESSION_COOKIE);
}

/** Clears every session for a user (used after a password reset). */
export function revokeUserSessions(userId: string): void {
  run("DELETE FROM sessions WHERE user_id = ?", userId);
}
