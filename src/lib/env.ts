import { randomBytes } from "node:crypto";

const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");

export const env = {
  appUrl: process.env.APP_URL || "http://localhost:3000",
  sessionSecret: SECRET,
  databasePath: process.env.DATABASE_PATH || "data/fulafia.db",
  uploadDir: process.env.UPLOAD_DIR || "storage/uploads",
  isProduction: process.env.NODE_ENV === "production",
  /**
   * "display" shows the reset link on screen (no mail provider connected).
   * "outbox" stops showing it publicly; an admin reads it from /admin/messages.
   */
  resetLinkMode: (process.env.PASSWORD_RESET_DELIVERY || "display") as "display" | "outbox",
};

if (!process.env.SESSION_SECRET && env.isProduction) {
  console.warn(
    "[config] SESSION_SECRET is not set. Sessions will stop working after a restart.",
  );
}
