/**
 * Schema migrations, applied in order. Each entry bumps `PRAGMA user_version`.
 * Never edit a shipped migration - add a new one.
 */
export const MIGRATIONS: string[] = [
  // 1 - initial schema
  `
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'organizer', 'admin')),
    organization_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE UNIQUE INDEX users_email_unique ON users (lower(email));

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX sessions_user_idx ON sessions (user_id);

  CREATE TABLE password_resets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE events (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('academic', 'religious', 'sports', 'social', 'entertainment', 'career', 'other')),
    description TEXT NOT NULL,
    event_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    flyer_path TEXT,
    ticket_type TEXT NOT NULL CHECK (ticket_type IN ('free', 'paid')),
    price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
    capacity INTEGER CHECK (capacity IS NULL OR capacity > 0),
    registration_deadline TEXT,
    contact_type TEXT CHECK (contact_type IN ('whatsapp', 'phone', 'website')),
    contact_value TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'sold_out', 'cancelled')),
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX events_status_date_idx ON events (status, event_date);
  CREATE INDEX events_organizer_idx ON events (organizer_id);
  CREATE INDEX events_category_idx ON events (category);

  CREATE TABLE registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending_payment', 'confirmed', 'cancelled')),
    registered_at TEXT NOT NULL,
    payment_confirmed_at TEXT,
    cancelled_at TEXT
  );
  CREATE INDEX registrations_event_idx ON registrations (event_id, status);
  CREATE INDEX registrations_user_idx ON registrations (user_id);
  CREATE UNIQUE INDEX registrations_one_active_per_student
    ON registrations (event_id, user_id) WHERE status <> 'cancelled';

  CREATE TABLE check_ins (
    id TEXT PRIMARY KEY,
    registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    checked_in_by TEXT NOT NULL REFERENCES users(id),
    checked_in_at TEXT NOT NULL
  );
  CREATE INDEX check_ins_event_idx ON check_ins (event_id);

  CREATE TABLE bookmarks (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, event_id)
  );

  CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
    created_at TEXT NOT NULL,
    resolved_at TEXT,
    resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL
  );
  CREATE INDEX reports_status_idx ON reports (status, created_at);

  CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX notifications_user_idx ON notifications (user_id, created_at);

  CREATE TABLE email_outbox (
    id TEXT PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TEXT,
    created_at TEXT NOT NULL
  );
  `,
];
