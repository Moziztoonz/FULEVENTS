#!/usr/bin/env node
/**
 * Seeds the database with demo accounts and five clearly-labelled sample events.
 *
 * Usage:  npm run db:seed
 * Safe to run more than once: accounts are created only when missing and sample
 * events are skipped if they already exist.
 */
import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DB_PATH = path.resolve(ROOT, process.env.DATABASE_PATH || "data/fulafia.db");
const UPLOAD_DIR = path.resolve(ROOT, process.env.UPLOAD_DIR || "storage/uploads");

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@fulafia.edu.ng").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin12345!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Platform Administrator";

const DAY = 86400000;

function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${derived.toString("hex")}`;
}

function isoDate(offsetDays) {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

function nowISO() {
  return new Date().toISOString();
}

function ticketCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(9);
  let out = "";
  for (let i = 0; i < 8; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `FUL-${out.slice(0, 4)}-${out.slice(4)}`;
}

/** Reads the SQL blocks out of src/lib/migrations.ts so the schema stays in one place. */
function readMigrations() {
  const source = fs.readFileSync(path.join(ROOT, "src/lib/migrations.ts"), "utf8");
  const chunks = source.split("`");
  // Odd indexes are template literals; keep only real migration blocks so
  // inline code spans in comments cannot be mistaken for SQL.
  return chunks.filter((chunk, index) => index % 2 === 1 && chunk.includes("CREATE TABLE"));
}

function migrate(db) {
  const row = db.prepare("PRAGMA user_version").get();
  const current = Number(row?.user_version ?? 0);
  const migrations = readMigrations();
  for (let version = current; version < migrations.length; version += 1) {
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(migrations[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

const CATEGORY_STYLE = {
  academic: ["#0a5136", "#16835a", "#d9f0c4"],
  religious: ["#2b3d63", "#4a6ba3", "#e7eefb"],
  sports: ["#8a3b06", "#c46a1b", "#ffe6cc"],
  entertainment: ["#4a1d55", "#8a3d99", "#f4ddf7"],
  career: ["#0c4a52", "#136f7a", "#d4f0f2"],
  social: ["#5c2b12", "#94502a", "#fbe6d7"],
  other: ["#243b2e", "#3f6350", "#e3efe7"],
};

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[character]);
}

function wrap(text, perLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function flyerSvg({ title, category, date, venue, price }) {
  const [dark, mid, light] = CATEGORY_STYLE[category] || CATEGORY_STYLE.other;
  const titleLines = wrap(title, 24).slice(0, 3);
  const titleMarkup = titleLines
    .map((line, index) => `<tspan x="64" dy="${index === 0 ? 0 : 62}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="750" viewBox="0 0 1200 750" role="img" aria-label="${escapeXml(title)}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="65%" stop-color="${mid}"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="12%" r="60%">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="750" fill="url(#bg)"/>
  <rect width="1200" height="750" fill="url(#glow)"/>
  <g opacity="0.18" stroke="${light}" stroke-width="2" fill="none">
    <circle cx="1050" cy="120" r="180"/>
    <circle cx="1050" cy="120" r="120"/>
    <circle cx="120" cy="660" r="150"/>
  </g>
  <text x="64" y="220" fill="#ffffff" font-family="Georgia,serif" font-size="62" font-weight="bold">${titleMarkup}</text>
  <line x1="64" y1="500" x2="1136" y2="500" stroke="${light}" stroke-opacity="0.4" stroke-width="2"/>
  <text x="64" y="566" fill="#ffffff" font-family="Helvetica,Arial,sans-serif" font-size="30">${escapeXml(date)}</text>
  <text x="64" y="614" fill="${light}" font-family="Helvetica,Arial,sans-serif" font-size="26">${escapeXml(venue)}</text>
  <text x="64" y="692" fill="#ffffff" font-family="Helvetica,Arial,sans-serif" font-size="24" font-weight="bold">${escapeXml(price)}</text>
  <text x="1136" y="692" fill="${light}" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="22">Campus Events · Federal University of Lafia</text>
</svg>`;
}

function writeFlyer(event) {
  const dir = path.join(UPLOAD_DIR, "events");
  fs.mkdirSync(dir, { recursive: true });
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${event.eventDate}T12:00:00Z`));
  const priceLabel =
    event.ticketType === "free" ? "Free entry" : `NGN ${Number(event.price).toLocaleString("en-NG")}`;
  const svg = flyerSvg({
    title: event.title,
    category: event.category,
    date: dateLabel,
    venue: event.venue,
    price: priceLabel,
  });
  // Include a content hash so a reseed never reuses a filename the browser
  // may still hold in its immutable image cache.
  const hash = createHash("sha1").update(svg).digest("hex").slice(0, 8);
  const name = `sample-${event.slug}-${hash}.svg`;
  fs.writeFileSync(path.join(dir, name), svg);
  return name;
}

function upsertUser(db, user) {
  const existing = db.prepare("SELECT id FROM users WHERE lower(email) = ?").get(user.email);
  if (existing) {
    // Refresh demo passwords so the documented logins always work on reseed.
    db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
      hashPassword(user.password),
      nowISO(),
      existing.id,
    );
    return existing.id;
  }
  const id = randomUUID();
  const now = nowISO();
  db.prepare(
    `INSERT INTO users (id, full_name, email, phone, password_hash, role, organization_name,
      contact_phone, contact_email, is_blocked, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  ).run(
    id,
    user.fullName,
    user.email,
    user.phone || null,
    hashPassword(user.password),
    user.role,
    user.organizationName || null,
    user.contactPhone || null,
    user.contactEmail || user.email,
    now,
    now,
  );
  return id;
}

function seedEvent(db, organizerId, event) {
  const existing = db.prepare("SELECT id FROM events WHERE title = ?").get(event.title);
  if (existing) return { id: existing.id, skipped: true };

  const id = randomUUID();
  const flyer = writeFlyer(event);
  const now = nowISO();
  db.prepare(
    `INSERT INTO events (id, organizer_id, title, category, description, event_date, start_time, end_time,
      venue, flyer_path, ticket_type, price, capacity, registration_deadline, contact_type, contact_value,
      contact_phone, contact_email, status, featured, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?)`,
  ).run(
    id,
    organizerId,
    event.title,
    event.category,
    event.description,
    event.eventDate,
    event.startTime,
    event.endTime,
    event.venue,
    flyer,
    event.ticketType,
    event.price || 0,
    event.capacity ?? null,
    event.deadline ?? null,
    event.ticketType === "paid" ? "whatsapp" : null,
    event.ticketType === "paid" ? event.contactValue : null,
    event.contactPhone,
    event.contactEmail,
    event.featured ? 1 : 0,
    now,
    now,
  );
  return { id, skipped: false };
}

function seedRegistration(db, eventId, userId, status) {
  const existing = db.prepare(
    "SELECT id FROM registrations WHERE event_id = ? AND user_id = ? AND status <> 'cancelled'",
  ).get(eventId, userId);
  if (existing) return existing.id;
  const id = randomUUID();
  db.prepare(
    `INSERT INTO registrations (id, event_id, user_id, ticket_code, status, registered_at, payment_confirmed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    eventId,
    userId,
    ticketCode(),
    status,
    nowISO(),
    status === "confirmed" ? nowISO() : null,
  );
  return id;
}

function main() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON");
  migrate(db);

  // Clear flyers from previous seeds so old files do not pile up.
  const flyerDir = path.join(UPLOAD_DIR, "events");
  if (fs.existsSync(flyerDir)) {
    for (const file of fs.readdirSync(flyerDir)) {
      if (file.startsWith("sample-")) fs.rmSync(path.join(flyerDir, file), { force: true });
    }
  }

  const adminId = upsertUser(db, {
    fullName: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: "admin",
    phone: "08030000000",
  });

  const organizers = {
    academic: upsertUser(db, {
      fullName: "Dr. Musa Adamu",
      email: "musa.adamu@example.com",
      password: "Organiser123!",
      role: "organizer",
      phone: "08031234567",
      organizationName: "FULAFIA Academic Forum (sample)",
      contactPhone: "08031234567",
      contactEmail: "academic.forum@example.com",
    }),
    faith: upsertUser(db, {
      fullName: "Grace Okonkwo",
      email: "grace.okonkwo@example.com",
      password: "Organiser123!",
      role: "organizer",
      phone: "08037654321",
      organizationName: "Campus Fellowship (sample)",
      contactPhone: "08037654321",
      contactEmail: "fellowship@example.com",
    }),
    sports: upsertUser(db, {
      fullName: "Ibrahim Sule",
      email: "ibrahim.sule@example.com",
      password: "Organiser123!",
      role: "organizer",
      phone: "08035551234",
      organizationName: "FULAFIA Sports Council (sample)",
      contactPhone: "08035551234",
      contactEmail: "sports@example.com",
    }),
    vibes: upsertUser(db, {
      fullName: "Blessing Eze",
      email: "blessing.eze@example.com",
      password: "Organiser123!",
      role: "organizer",
      phone: "08039998877",
      organizationName: "Campus Vibes Entertainment (sample)",
      contactPhone: "08039998877",
      contactEmail: "vibes@example.com",
    }),
    career: upsertUser(db, {
      fullName: "Ahmed Bello",
      email: "ahmed.bello@example.com",
      password: "Organiser123!",
      role: "organizer",
      phone: "08037774433",
      organizationName: "FULAFIA Career Services (sample)",
      contactPhone: "08037774433",
      contactEmail: "careers@example.com",
    }),
  };

  const student = upsertUser(db, {
    fullName: "Aisha Mohammed",
    email: "student@fulafia.edu.ng",
    password: "Student123!",
    role: "student",
    phone: "08031112222",
  });

  const student2 = upsertUser(db, {
    fullName: "Peter Danjuma",
    email: "peter.danjuma@example.com",
    password: "Student123!",
    role: "student",
    phone: "08033334444",
  });

  const sampleNote =
    "Sample event: this listing is demonstration content built for the Campus Events platform. It is not an official announcement from Federal University of Lafia.";

  const events = [
    {
      slug: "academic-seminar",
      organizer: organizers.academic,
      title: "[Sample] Research Writing Seminar for Final Year Students",
      category: "academic",
      description:
        "A practical two-hour seminar on writing a final year project that supervisors actually enjoy reading. We will cover choosing a researchable topic, structuring chapters, referencing properly and using the library's online databases.\n\nBring your laptop if you have one, plus a draft of your current chapter. There will be time for questions and a short clinic where you can get feedback on your topic.\n\n" +
        sampleNote,
      eventDate: isoDate(1),
      startTime: "10:00",
      endTime: "12:00",
      venue: "1000 Capacity Lecture Theatre, Permanent Site",
      ticketType: "free",
      capacity: 120,
      deadline: isoDate(1),
      contactPhone: "08031234567",
      contactEmail: "academic.forum@example.com",
      featured: true,
    },
    {
      slug: "career-fair",
      organizer: organizers.career,
      title: "[Sample] Career Fair: Meet Recruiters From Abuja and Lafia",
      category: "career",
      description:
        "Eight employers are coming to campus to talk about internships and graduate roles. Come with printed copies of your CV and dress the way you would for an interview.\n\nSessions include a short talk on what recruiters look for, quick CV reviews, and open conversations with each organisation. Registration closes once the hall is full.\n\n" +
        sampleNote,
      eventDate: isoDate(4),
      startTime: "09:00",
      endTime: "14:00",
      venue: "Faculty of Arts Auditorium",
      ticketType: "free",
      capacity: 200,
      deadline: isoDate(3),
      contactPhone: "08037774433",
      contactEmail: "careers@example.com",
      featured: true,
    },
    {
      slug: "interfaculty-football",
      organizer: organizers.sports,
      title: "[Sample] Inter-Faculty Football Final",
      category: "sports",
      description:
        "Faculty of Science takes on Faculty of Social Sciences in the final of the inter-faculty cup. Both teams have been unbeaten this season, so expect a tight match.\n\nGates open an hour before kick-off. Bring your student ID and a ticket for entry. Seating is first come, first served.\n\n" +
        sampleNote,
      eventDate: isoDate(3),
      startTime: "15:30",
      endTime: "17:30",
      venue: "Main Sports Field, Permanent Site",
      ticketType: "paid",
      price: 500,
      capacity: 300,
      deadline: isoDate(2),
      contactPhone: "08035551234",
      contactEmail: "sports@example.com",
      contactValue: "08035551234",
      featured: false,
    },
    {
      slug: "worship-night",
      organizer: organizers.faith,
      title: "[Sample] Campus Worship Night",
      category: "religious",
      description:
        "An evening of music, prayer and short reflections to close the semester. Different campus fellowships are coming together for this one, so bring a friend.\n\nThe programme runs for about two hours and ends with light refreshments. Free entry, but please register so we can plan enough refreshments.\n\n" +
        sampleNote,
      eventDate: isoDate(6),
      startTime: "17:00",
      endTime: "19:30",
      venue: "University Chapel, Permanent Site",
      ticketType: "free",
      capacity: 250,
      deadline: isoDate(5),
      contactPhone: "08037654321",
      contactEmail: "fellowship@example.com",
      featured: false,
    },
    {
      slug: "movie-night",
      organizer: organizers.vibes,
      title: "[Sample] Outdoor Movie Night: Nollywood Classics",
      category: "entertainment",
      description:
        "Two classic Nollywood films on a big outdoor screen, with popcorn, small chops and a playlist before the first film starts.\n\nBring a mat or a jacket. Tickets are limited and pay on the day is not guaranteed, so reserve a spot and pay the organiser on WhatsApp.\n\n" +
        sampleNote,
      eventDate: isoDate(8),
      startTime: "18:00",
      endTime: "22:00",
      venue: "Student Union Building Lawn",
      ticketType: "paid",
      price: 1000,
      capacity: 150,
      deadline: isoDate(7),
      contactPhone: "08039998877",
      contactEmail: "vibes@example.com",
      contactValue: "08039998877",
      featured: false,
    },
    {
      slug: "orientation-talk",
      organizer: organizers.academic,
      title: "[Sample] Study Skills Talk: Preparing for First Semester Exams",
      category: "academic",
      description:
        "A short session on planning revision, using past questions properly and managing exam-day stress. It ran last week and the recording link will be shared with everyone who registered.\n\n" +
        sampleNote,
      eventDate: isoDate(-6),
      startTime: "11:00",
      endTime: "12:30",
      venue: "Faculty of Science Lecture Room 2",
      ticketType: "free",
      capacity: 80,
      deadline: isoDate(-7),
      contactPhone: "08031234567",
      contactEmail: "academic.forum@example.com",
      featured: false,
    },
  ];

  const seeded = [];
  for (const event of events) {
    const result = seedEvent(db, event.organizer, event);
    seeded.push({ ...event, id: result.id, skipped: result.skipped });
  }

  const seminar = seeded.find((event) => event.slug === "academic-seminar");
  const football = seeded.find((event) => event.slug === "interfaculty-football");

  seedRegistration(db, seminar.id, student, "confirmed");
  seedRegistration(db, football.id, student2, "pending_payment");

  db.close();

  console.log("Seed complete.");
  console.log(`Events: ${seeded.filter((event) => !event.skipped).length} added, ${seeded.filter((event) => event.skipped).length} already present.`);
  console.log("");
  console.log("Demo logins:");
  console.log(`  Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("  Student:  student@fulafia.edu.ng / Student123!");
  console.log("  Organiser: musa.adamu@example.com / Organiser123!");
}

main();
