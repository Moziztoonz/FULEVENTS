# Campus Events and Ticketing Platform — Federal University of Lafia

A working events platform for FULAFIA: students discover events, register, and hold a real
digital ticket with a QR code. Organisers publish events, confirm offline payments, export
attendee lists and check people in at the gate. Admins moderate.

No payment gateway is involved anywhere. For paid events students contact the organiser and pay
outside the platform; the organiser marks the payment confirmed.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript | Server-rendered pages for slow phones, one deployable for pages and API |
| Styling | Tailwind CSS v4 with a small design-token layer | No component-library bloat; consistent spacing, type and colour |
| Database | SQLite via Node's built-in `node:sqlite` | Real relational persistence with zero native builds and zero external accounts |
| Auth | Email + password, scrypt hashing, database-backed sessions in an httpOnly cookie | No third-party auth dependency; passwords never stored in plain text |
| Files | Local disk under `storage/uploads`, served through `/api/files/:name` | Persistent, validated uploads without an object-storage account |
| Validation | Zod on every write endpoint | One schema per form, readable field errors |
| QR | `qrcode` (generate), `jsqr` (camera scanning) | Small, works in mobile browsers |
| Tickets | `pdf-lib` for PDF, canvas for PNG | Real downloadable, readable tickets |

Everything the brief asked for runs against the real database. There is no mock data path and no
in-memory fallback.

---

## Quick start

Requirements: **Node.js 24 or newer** (the app uses the built-in `node:sqlite`, so there is no
native module to compile) and npm.

```bash
npm install                 # install dependencies
cp .env.example .env.local  # then edit the values

npm run db:seed             # creates tables + demo accounts + sample events
npm run dev                 # http://localhost:3000
```

That is enough to try the whole product. For a production run:

```bash
npm run build
npm start
```

### Demo logins created by the seed

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@fulafia.edu.ng` | `Admin12345!` |
| Student | `student@fulafia.edu.ng` | `Student123!` |
| Organiser | `musa.adamu@example.com` | `Organiser123!` |
| Organiser | `grace.okonkwo@example.com` (and four more) | `Organiser123!` |

Change the admin password before deploying by setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` in
`.env.local` and running `npm run db:seed` again (it updates the seeded demo passwords).

The seed creates six events: five upcoming across academic, career, sports, religious and
entertainment categories, plus one past event so the archive and "past events" views have
something real to show. Every seeded title starts with `[Sample]` and each description says it is
demonstration content, so nothing looks like an official university announcement.

To start completely empty (zero events is a supported state):

```bash
rm -f data/fulafia.db data/fulafia.db-wal data/fulafia.db-shm
npm run db:seed   # only seeds accounts if you still want demo logins
```

---

## Environment variables

See `.env.example` for the annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `APP_URL` | yes | Public origin, used in share links and password-reset links |
| `SESSION_SECRET` | yes in production | Server-side secret material; set a long random string |
| `DATABASE_PATH` | no | SQLite file path (default `data/fulafia.db`) |
| `UPLOAD_DIR` | no | Flyer storage directory (default `storage/uploads`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | seed only | Admin account the seed script creates |
| `PASSWORD_RESET_DELIVERY` | no | `display` shows reset links on screen, `outbox` hides them from the public |

Nothing secret is read in the browser. No variable is exposed with `NEXT_PUBLIC_`.

---

## Database

Schema lives in [`src/lib/migrations.ts`](src/lib/migrations.ts) and is applied automatically on
first database access, tracked with `PRAGMA user_version`. `npm run db:migrate` applies pending
migrations without touching data.

Tables: `users`, `sessions`, `password_resets`, `events`, `registrations`, `check_ins`,
`bookmarks`, `reports`, `notifications`, `email_outbox`.

Integrity rules that are enforced by the database itself:

- unique email per account (`lower(email)` index) and unique ticket codes;
- one active registration per student per event (partial unique index that ignores cancelled rows);
- one check-in per registration (`check_ins.registration_id UNIQUE`);
- foreign keys with `ON DELETE CASCADE` so deleting an event removes its tickets, check-ins and
  bookmarks in one transaction;
- indexes on `events(status, event_date)`, `events(organizer_id)`, `events(category)`,
  `registrations(event_id, status)`, `registrations(user_id)`, `notifications(user_id, created_at)`.

**Registration is atomic.** `registerForEvent` opens a `BEGIN IMMEDIATE` transaction, re-reads
capacity inside it, checks for duplicates, inserts the ticket and flips the event to `sold_out`
when the last seat goes. Two students tapping at the same moment cannot both get seat 51.

---

## How ticketing works

1. Student taps **Get free ticket** or **Reserve a ticket** on an event page.
2. The API checks the account, event status, registration deadline, capacity and duplicates.
3. A registration row is created with a random code from an unambiguous alphabet
   (`FUL-XXXX-XXXX`, `crypto.randomBytes`, uniqueness retried).
4. Free event → status `confirmed` immediately. Paid event → `pending_payment`.
5. The ticket page renders the code and a QR code; PDF and PNG downloads include the same code.
6. The organiser confirms payment in their dashboard (only for paid events, only their events).
7. At the gate the organiser opens check-in and types or scans the code. The API checks ownership
   of the event, ticket existence, guest-event match, confirmation, and prior use, then writes the
   check-in timestamp. A second scan returns **"Ticket already used."**

Students can cancel an upcoming ticket (a paid cancellation still needs the organiser to be told
outside the platform; the page says so). Cancelling frees the seat and reopens a sold-out event.

---

## Testing

The repository ships an end-to-end suite that drives the real HTTP surface — real cookies, real
uploads, real database writes.

```bash
npm run dev            # terminal 1
npm run test:flows     # terminal 2
```

It also accepts a different server: `BASE_URL=http://127.0.0.1:3100 npm run test:flows`.

Current status: **71 checks passed, 0 failed** against both `next dev` and a production
`next build && next start` server.

What it covers:

- public pages render, filters work, unknown events 404, guests are redirected from dashboards;
- organiser: register → create event with flyer → publish → visible publicly → searchable → edit →
  attendee CSV;
- student: register → ticket page → PDF download → My tickets → bookmark → report event →
  notifications;
- paid event: reservation is pending, check-in refused until the organiser confirms, capacity-one
  event flips to sold out, overbooking refused;
- check-in: first scan succeeds, repeat scan returns "Ticket already used.", wrong-event ticket
  refused;
- security: second organiser cannot edit/delete/check in on someone else's event, another user
  cannot download someone else's ticket, guests cannot register, students cannot create events or
  use check-in, non-image uploads rejected, past dates / reversed times / negative prices / paid
  events without contact details rejected, cross-origin writes blocked, suspended accounts lose
  their sessions and cannot log in, admin-only endpoints refuse students;
- admin: login, all admin pages, feature an event, resolve reports, suspend and restore a user;
- password reset: link issued, password changed, old sessions revoked, token cannot be reused;
- cancellation marks the ticket cancelled in My tickets.

`npm run typecheck` runs TypeScript over the whole project.

---

## Deployment

The app needs a **Node host with a persistent disk**. It is a normal long-running Node server:
`node:sqlite` and uploaded flyers both need a real filesystem, so serverless platforms and
Cloudflare Workers are not a fit without swapping the storage layer for a hosted database and
object storage. Vercel-style ephemeral filesystems will lose the database and flyers.

Ready-to-use values are in `.env.example`.

```bash
# on the server, with the repository checked out
npm ci
npm run build
npm start          # binds 0.0.0.0:3000
```

Then:

1. Point a reverse proxy (Caddy, Nginx, Traefik) at port 3000 and terminate HTTPS. HTTPS is
   required for camera scanning — browsers block `getUserMedia` on plain HTTP origins.
2. Set `APP_URL` to the public HTTPS origin and a long random `SESSION_SECRET`.
3. Make `data/` and `storage/uploads/` writable and **backed up**. Keeping them on a mounted
   volume outside the release directory means a deploy never deletes tickets or flyers.
4. Run `npm run db:migrate` on deploy (or let the app apply migrations on first request), and
   `npm run db:seed` once if you want the sample content.
5. Keep the process alive with your supervisor of choice, for example:

```ini
[Unit]
Description=Campus Events
After=network.target

[Service]
WorkingDirectory=/srv/campus-events
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
EnvironmentFile=/srv/campus-events/.env.production
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

6. Create your real admin account before going live:

```bash
ADMIN_EMAIL=you@fulafia.edu.ng ADMIN_PASSWORD='a-long-password' npm run db:seed
```

(Or register a normal account and promote it with
`UPDATE users SET role = 'admin' WHERE lower(email) = '...';` using the `sqlite3` CLI.)

### Backups

The database is a single file plus its WAL. Back it up with SQLite itself, not `cp`, while the app
is running:

```bash
node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('data/fulafia.db');db.exec(\"VACUUM INTO 'backups/fulafia-$(date +%F).db'\")"
tar czf backups/uploads-$(date +%F).tar.gz storage/uploads
```

Run that nightly from cron and keep the last 14 days.

---

## Security notes

- Passwords: scrypt (N=16384, r=8, p=1) with a random salt, compared with `timingSafeEqual`.
  Plain text passwords are never written anywhere.
- Sessions: 32 random bytes, stored only as a SHA-256 hash; httpOnly, `sameSite=lax`, `secure` in
  production, 30-day expiry, revoked on password reset and on account suspension.
- Authorisation is checked inside every write endpoint (`requireUser([...roles])` plus explicit
  ownership checks) — hiding a button is never the only control.
- CSRF: mutating requests must match the request `Host` in their `Origin` header; cookies are
  `sameSite=lax`. Verified by the cross-origin check in the test suite.
- SQL injection: every query is parameterised. LIKE patterns escape `%` and `_`.
- XSS: React escapes all rendered values; no `dangerouslySetInnerHTML` anywhere.
- Uploads: validated by file signature (not the browser MIME type or extension), capped at 5MB,
  stored with a random name, served with `X-Content-Type-Options: nosniff` and a restrictive CSP.
- External contact links open with `rel="noopener noreferrer nofollow"`.
- CSV export quotes every cell and prefixes formula-leading values to blunt CSV injection.
- Rate limits on login, registration, password reset, reporting and check-in are in-memory per
  process. For multi-instance deployments, move them to Redis or a database table.
- Ticket codes are 8 characters from a 32-symbol alphabet (2^40 space) and unique in the database.

---

## Project structure

```
src/
  app/
    page.tsx                     homepage: featured, today, this week, categories, recent, past
    events/                      listing with filters + event detail page
    tickets/                     my tickets + ticket detail (QR, downloads, cancel)
    saved/  notifications/       bookmarks and in-app notifications
    login/ register/ forgot-password/ reset-password/
    organizer/                   dashboard, create/edit, manage attendees, check-in
    admin/                       overview, users, events, reports, message outbox
    api/                         auth, events, registrations, bookmarks, reports,
                                 check-in, CSV, ticket PDF, file serving, admin actions
  components/                    UI primitives, event card, forms, organiser + admin widgets
  lib/                           db, migrations, auth, ticketing, validation, storage, stats
scripts/
  seed.mjs                       schema + demo accounts + six labelled sample events
  test-flows.mjs                 71-check end-to-end suite
storage/uploads/events/          uploaded and sample flyers (git-ignored contents)
data/                            SQLite database (git-ignored)
```

---

## Known limitations and external configuration still required

- **No email provider is connected.** Password reset links are written to the `email_outbox` table
  (visible to admins at `/admin/messages`) and, with `PASSWORD_RESET_DELIVERY=display`, also shown
  on the forgot-password screen. To send real email, replace the queue step in
  [`src/lib/reset.ts`](src/lib/reset.ts) with your provider (Resend, Postmark, SMTP) and set the
  messages' `sent_at` when accepted. Nothing else needs to change.
- **No payment processing, by design.** Paid events show the organiser's WhatsApp/phone/website
  contact, and confirmation is manual. There is no card form, wallet or gateway integration.
- **Single-node writes.** SQLite handles this workload comfortably (thousands of registrations a
  day), but the app assumes one Node process writing to one database file. Running several app
  instances needs a shared PostgreSQL and a shared file store, plus moving the in-memory rate
  limiter to a shared store.
- **Camera scanning depends on the browser.** It needs HTTPS and camera permission. When the
  camera is unavailable the check-in page falls back to typing the code, which is always available.
- **No real-time updates.** Dashboards read fresh data on load and after each action; there is no
  push/websocket channel, deliberately kept out of scope.
