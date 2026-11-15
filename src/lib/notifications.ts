import { randomUUID } from "node:crypto";
import { all, get, run } from "./db";
import type { NotificationRow } from "./types";
import { nowISO } from "./utils";

export interface NotifyInput {
  type: "registration" | "ticket" | "payment" | "cancellation" | "event" | "report" | "account";
  title: string;
  body: string;
  link?: string;
}

export function notify(userId: string, input: NotifyInput): void {
  run(
    `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    randomUUID(),
    userId,
    input.type,
    input.title,
    input.body,
    input.link ?? null,
    nowISO(),
  );
}

export function listNotifications(userId: string, limit = 30): NotificationRow[] {
  return all<NotificationRow>(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    userId,
    limit,
  );
}

export function unreadCount(userId: string): number {
  const row = get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL",
    userId,
  );
  return Number(row?.count ?? 0);
}

export function markAllRead(userId: string): void {
  run("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", nowISO(), userId);
}

export function markRead(userId: string, id: string): void {
  run("UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?", nowISO(), id, userId);
}

export function listAdmins(): Array<{ id: string }> {
  return all<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
}
