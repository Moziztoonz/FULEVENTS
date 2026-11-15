import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { MIGRATIONS } from "./migrations";
import { env } from "./env";

export type SqlValue = string | number | null | Uint8Array;

declare global {
  // Reused across hot reloads in development so we never open two writers.
  // eslint-disable-next-line no-var
  var __fulafiaDb: DatabaseSync | undefined;
}

const dbPath = path.resolve(process.cwd(), env.databasePath);

function open(): DatabaseSync {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA synchronous = NORMAL");
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync) {
  const row = db.prepare("PRAGMA user_version").get() as { user_version?: number } | undefined;
  const current = Number(row?.user_version ?? 0);
  if (current > MIGRATIONS.length) {
    throw new Error(
      `Database schema version ${current} is newer than this code (${MIGRATIONS.length}).`,
    );
  }
  for (let version = current; version < MIGRATIONS.length; version += 1) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`Migration ${version + 1} failed: ${(error as Error).message}`);
    }
  }
}

export function getDb(): DatabaseSync {
  if (!globalThis.__fulafiaDb) {
    globalThis.__fulafiaDb = open();
  }
  return globalThis.__fulafiaDb;
}

export function all<T = Record<string, unknown>>(sql: string, ...params: SqlValue[]): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function get<T = Record<string, unknown>>(sql: string, ...params: SqlValue[]): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function run(sql: string, ...params: SqlValue[]) {
  return getDb().prepare(sql).run(...params);
}

/**
 * Runs `fn` inside an immediate (write-locking) transaction. SQLite serialises
 * writers, so capacity checks inside this block cannot race with another
 * registration.
 */
export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
