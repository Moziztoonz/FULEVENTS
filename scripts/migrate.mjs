#!/usr/bin/env node
/**
 * Applies pending database migrations without seeding any data.
 * Usage: npm run db:migrate
 */
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DB_PATH = path.resolve(ROOT, process.env.DATABASE_PATH || "data/fulafia.db");

function readMigrations() {
  const source = fs.readFileSync(path.join(ROOT, "src/lib/migrations.ts"), "utf8");
  const chunks = source.split("`");
  return chunks.filter((chunk, index) => index % 2 === 1 && chunk.includes("CREATE TABLE"));
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

const migrations = readMigrations();
const current = Number(db.prepare("PRAGMA user_version").get()?.user_version ?? 0);
console.log(`Database: ${DB_PATH}`);
console.log(`Schema version: ${current} of ${migrations.length}`);

for (let version = current; version < migrations.length; version += 1) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.exec(migrations[version]);
    db.exec(`PRAGMA user_version = ${version + 1}`);
    db.exec("COMMIT");
    console.log(`Applied migration ${version + 1}.`);
  } catch (error) {
    db.exec("ROLLBACK");
    console.error(`Migration ${version + 1} failed: ${error.message}`);
    process.exit(1);
  }
}

db.close();
console.log("Database is up to date.");
