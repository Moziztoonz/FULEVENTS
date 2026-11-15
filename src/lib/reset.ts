import { createHash, randomBytes, randomUUID } from "node:crypto";
import { get, run } from "./db";
import { env } from "./env";
import { nowISO } from "./utils";

const RESET_MINUTES = 60;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Creates a single-use reset token and queues the message.
 *
 * No mail provider is connected in this deployment. Every message is written
 * to `email_outbox` (readable by admins at /admin/messages) and, in display
 * mode, the link is also returned so the student can reset immediately.
 * To send real email, replace the queue step below with your provider's API.
 */
export function createPasswordReset(userId: string, email: string): { resetUrl: string } {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000).toISOString();

  run(
    "INSERT INTO password_resets (id, user_id, token_hash, expires_at, used_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
    randomUUID(),
    userId,
    hashToken(token),
    expiresAt,
    nowISO(),
  );

  const resetUrl = `${env.appUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
  const body = [
    "Someone asked to reset the password for your Campus Events account.",
    "",
    `Open this link within ${RESET_MINUTES} minutes to choose a new password:`,
    resetUrl,
    "",
    "If this was not you, you can ignore this message. Your password will stay the same.",
  ].join("\n");

  run(
    "INSERT INTO email_outbox (id, to_email, subject, body, sent_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
    randomUUID(),
    email,
    "Reset your Campus Events password",
    body,
    nowISO(),
  );

  return { resetUrl };
}

export function consumePasswordReset(token: string): { userId: string } | null {
  const hash = hashToken(token);
  const row = get<{ id: string; user_id: string; expires_at: string; used_at: string | null }>(
    "SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?",
    hash,
  );
  if (!row || row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  return { userId: row.user_id };
}

export function markResetUsed(token: string): void {
  run("UPDATE password_resets SET used_at = ? WHERE token_hash = ?", nowISO(), hashToken(token));
}
