#!/usr/bin/env node
/**
 * End-to-end checks against a running dev server.
 *
 *   npm run dev          # in another terminal
 *   npm run test:flows
 *
 * Covers the organiser, student, ticketing, check-in, payment, admin and
 * security flows described in the project brief. Exits non-zero on failure.
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const ORIGIN = new URL(BASE).origin;
const stamp = Date.now();

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${detail ? ` → ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` → ${detail}` : ""}`);
  }
}

function makeClient(label) {
  const jar = new Map();
  async function request(path, options = {}) {
    const { method = "GET", json, form, redirect = "manual", raw = false } = options;
    const headers = { Origin: ORIGIN };
    if (jar.size) headers.Cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    let body;
    if (json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(json);
    } else if (form instanceof FormData) {
      body = form;
    }
    const response = await fetch(`${BASE}${path}`, { method, headers, body, redirect, signal: AbortSignal.timeout(90000) });
    for (const cookie of response.headers.getSetCookie?.() ?? []) {
      const [pair] = cookie.split(";");
      const index = pair.indexOf("=");
      const name = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (value === "" || /expires=thu, 01 jan 1970/i.test(cookie)) jar.delete(name);
      else jar.set(name, value);
    }
    if (raw) return response;
    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { text };
    }
    return { status: response.status, data, text, headers: response.headers, label };
  }
  return request;
}

function isoOffset(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

// 1x1 transparent PNG, valid magic bytes for the upload check.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

function eventForm(overrides = {}) {
  const data = {
    title: "Test Lecture on Quantum Computing",
    category: "academic",
    description:
      "A test event created by the automated flow suite. It covers the core details students need when they look at an event page.",
    eventDate: isoOffset(5),
    startTime: "10:00",
    endTime: "12:00",
    venue: "Test Hall, Permanent Site",
    ticketType: "free",
    price: "",
    capacity: "",
    registrationDeadline: "",
    contactType: "",
    contactValue: "",
    contactPhone: "08031234567",
    contactEmail: "test.organiser@example.com",
    action: "publish",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) form.set(key, String(value));
  form.set("flyer", new Blob([PNG], { type: "image/png" }), "flyer.png");
  return form;
}

async function main() {
  console.log(`\nRunning flow tests against ${BASE}\n`);

  const org = makeClient("organiser");
  const student = makeClient("student");
  const student2 = makeClient("student2");
  const otherOrg = makeClient("other organiser");
  const admin = makeClient("admin");
  const guest = makeClient("guest");

  console.log("Public pages");
  const home = await guest("/");
  check("homepage renders", home.status === 200 && home.text.includes("Find what"));
  check("seeded sample event is visible", home.text.includes("[Sample]"));
  const listing = await guest("/events");
  check("event listing renders", listing.status === 200 && listing.text.includes("Events at FULAFIA"));
  const filtered = await guest("/events?category=sports&price=paid&date=all");
  check("filtered listing renders", filtered.status === 200);
  const missing = await guest("/events/does-not-exist");
  check("unknown event returns 404", missing.status === 404);
  const organizerPageAsGuest = await guest("/organizer", { redirect: "manual" });
  check(
    "guest is redirected away from organiser pages",
    [307, 302, 303].includes(organizerPageAsGuest.status),
    `status ${organizerPageAsGuest.status}`,
  );

  console.log("\nOrganiser workflow");
  const orgEmail = `org.${stamp}@example.com`;
  const registered = await org("/api/auth/register", {
    method: "POST",
    json: {
      fullName: "Test Organiser",
      email: orgEmail,
      password: "Organiser123!",
      role: "organizer",
      organizationName: "Test Society",
      contactPhone: "08031234567",
    },
  });
  check("organiser account created", registered.status === 201, JSON.stringify(registered.data));

  const created = await org("/api/events", { method: "POST", form: eventForm() });
  const eventId = created.data.id;
  check("event created with flyer", created.status === 201 && Boolean(eventId), JSON.stringify(created.data));

  const publicEvent = await guest(`/events/${eventId}`);
  check("published event is publicly visible", publicEvent.status === 200 && publicEvent.text.includes("Quantum Computing"));

  const searchHit = await guest("/events?q=Quantum");
  check("search finds the new event", searchHit.text.includes("Quantum Computing"));

  const edited = await org(`/api/events/${eventId}`, {
    method: "PATCH",
    form: eventForm({ title: "Test Lecture on Quantum Computing (edited)" }),
  });
  check("organiser can edit their event", edited.status === 200, JSON.stringify(edited.data));
  const afterEdit = await guest(`/events/${eventId}`);
  check("edit is visible on the public page", afterEdit.text.includes("(edited)"));

  const orgPage = await org("/organizer");
  check("organiser dashboard renders", orgPage.status === 200 && orgPage.text.includes("Organiser"));

  console.log("\nStudent workflow");
  const studentEmail = `student.${stamp}@example.com`;
  const studentCreated = await student("/api/auth/register", {
    method: "POST",
    json: {
      fullName: "Test Student",
      email: studentEmail,
      password: "Student123!",
      role: "student",
    },
  });
  check("student account created", studentCreated.status === 201, JSON.stringify(studentCreated.data));

  const registration = await student("/api/registrations", { method: "POST", json: { eventId } });
  const ticketId = registration.data.ticketId;
  check("student registers for a free event", registration.status === 201 && Boolean(ticketId), JSON.stringify(registration.data));

  const duplicate = await student("/api/registrations", { method: "POST", json: { eventId } });
  check("duplicate registration rejected", duplicate.status === 409, `status ${duplicate.status}`);

  const ticketPage = await student(`/tickets/${ticketId}`);
  check("ticket page shows the code", ticketPage.status === 200 && ticketPage.text.includes("FUL-"));

  const pdf = await student(`/api/tickets/${ticketId}/pdf`, { raw: true });
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  check("ticket PDF downloads", pdf.status === 200 && pdfBytes.subarray(0, 4).toString() === "%PDF");

  const myTickets = await student("/tickets");
  check("ticket appears in My tickets", myTickets.status === 200 && myTickets.text.includes("Quantum Computing"));

  const bookmark = await student("/api/bookmarks", { method: "POST", json: { eventId } });
  check("bookmark saved", bookmark.status === 200 && bookmark.data.saved === true);
  const savedPage = await student("/saved");
  check("saved page lists the event", savedPage.text.includes("Quantum Computing"));

  const report = await student("/api/reports", {
    method: "POST",
    json: { eventId, reason: "misleading", details: "Automated test report." },
  });
  check("student can report an event", report.status === 201, JSON.stringify(report.data));

  const notifications = await student("/notifications");
  check("notifications page renders with ticket update", notifications.status === 200 && notifications.text.includes("You are in"));

  console.log("\nPaid event and check-in");
  const paid = await org("/api/events", {
    method: "POST",
    form: eventForm({
      title: "Test Paid Concert",
      category: "entertainment",
      ticketType: "paid",
      price: "1500",
      capacity: "1",
      contactType: "whatsapp",
      contactValue: "08031234567",
      eventDate: isoOffset(9),
    }),
  });
  const paidId = paid.data.id;
  check("paid event created", paid.status === 201 && Boolean(paidId), JSON.stringify(paid.data));
  const paidPage = await guest(`/events/${paidId}`);
  check("paid event shows contact to buy", paidPage.text.includes("wa.me") || paidPage.text.includes("WhatsApp"));

  const s2 = await student2("/api/auth/register", {
    method: "POST",
    json: { fullName: "Second Student", email: `s2.${stamp}@example.com`, password: "Student123!", role: "student" },
  });
  check("second student created", s2.status === 201, JSON.stringify(s2.data));

  const paidReg = await student2("/api/registrations", { method: "POST", json: { eventId: paidId } });
  check("student reserves a paid ticket", paidReg.status === 201 && paidReg.data.status === "pending_payment", JSON.stringify(paidReg.data));

  const soldOutPage = await guest(`/events/${paidId}`);
  check("capacity-one event is marked sold out", soldOutPage.text.includes("sold out"), "expected sold out copy");

  const student3 = makeClient("student3");
  await student3("/api/auth/register", {
    method: "POST",
    json: { fullName: "Third Student", email: `s3.${stamp}@example.com`, password: "Student123!", role: "student" },
  });
  const overbook = await student3("/api/registrations", { method: "POST", json: { eventId: paidId } });
  check("overbooking is rejected", [400, 409].includes(overbook.status), `status ${overbook.status}`);

  const attendees = await org(`/api/events/${eventId}/attendees`, { raw: true });
  const csv = await attendees.text();
  check("CSV attendee list downloads", attendees.status === 200 && csv.includes("Ticket code") && csv.includes("Test Student"));

  const pendingCheckIn = await org("/api/checkin", {
    method: "POST",
    json: { eventId: paidId, code: paidReg.data.ticketCode },
  });
  check("unpaid ticket cannot check in", pendingCheckIn.status === 400, `status ${pendingCheckIn.status}`);

  const confirm = await org(`/api/registrations/${paidReg.data.ticketId}/payment`, {
    method: "POST",
    json: { status: "confirmed" },
  });
  check("organiser confirms payment", confirm.status === 200 && confirm.data.status === "confirmed", JSON.stringify(confirm.data));

  const confirmedTicket = await student2(`/tickets/${paidReg.data.ticketId}`);
  check("ticket shows payment confirmed", confirmedTicket.text.includes("Payment confirmed"));

  const checkIn = await org("/api/checkin", {
    method: "POST",
    json: { eventId: paidId, code: paidReg.data.ticketCode },
  });
  check("confirmed ticket checks in", checkIn.status === 200, JSON.stringify(checkIn.data));

  const repeatCheckIn = await org("/api/checkin", {
    method: "POST",
    json: { eventId: paidId, code: paidReg.data.ticketCode },
  });
  check(
    "duplicate check-in rejected",
    repeatCheckIn.status === 409 && String(repeatCheckIn.data.error).includes("already used"),
    JSON.stringify(repeatCheckIn.data),
  );

  const wrongEvent = await org("/api/checkin", {
    method: "POST",
    json: { eventId, code: paidReg.data.ticketCode },
  });
  check("ticket from another event is rejected", wrongEvent.status === 400, JSON.stringify(wrongEvent.data));

  console.log("\nSecurity");
  const otherEmail = `other.${stamp}@example.com`;
  await otherOrg("/api/auth/register", {
    method: "POST",
    json: {
      fullName: "Other Organiser",
      email: otherEmail,
      password: "Organiser123!",
      role: "organizer",
      organizationName: "Other Society",
      contactPhone: "08037654321",
    },
  });
  const hijack = await otherOrg(`/api/events/${eventId}`, {
    method: "PATCH",
    form: eventForm({ title: "Hijacked" }),
  });
  check("another organiser cannot edit the event", hijack.status === 403, `status ${hijack.status}`);

  const hijackDelete = await otherOrg(`/api/events/${eventId}`, { method: "DELETE" });
  check("another organiser cannot delete the event", hijackDelete.status === 403, `status ${hijackDelete.status}`);

  const hijackCheckIn = await otherOrg("/api/checkin", {
    method: "POST",
    json: { eventId: paidId, code: paidReg.data.ticketCode },
  });
  check("another organiser cannot use check-in", hijackCheckIn.status === 403, `status ${hijackCheckIn.status}`);

  const pdfOfOther = await otherOrg(`/api/tickets/${ticketId}/pdf`);
  check("another user cannot download someone else's ticket", [403, 404].includes(pdfOfOther.status), `status ${pdfOfOther.status}`);

  const guestRegister = await guest("/api/registrations", { method: "POST", json: { eventId } });
  check("guests cannot register", guestRegister.status === 401, `status ${guestRegister.status}`);

  const studentCreateEvent = await student("/api/events", { method: "POST", form: eventForm() });
  check("students cannot create events", studentCreateEvent.status === 403, `status ${studentCreateEvent.status}`);

  const studentCheckIn = await student("/api/checkin", { method: "POST", json: { eventId, code: "FUL-AAAA-AAAA" } });
  check("students cannot use check-in", studentCheckIn.status === 403, `status ${studentCheckIn.status}`);

  const badFile = eventForm({ title: "Bad upload test event" });
  badFile.set("flyer", new Blob(["not an image"], { type: "text/plain" }), "notes.txt");
  const badUpload = await org("/api/events", { method: "POST", form: badFile });
  check("non-image flyer rejected", badUpload.status === 400, `status ${badUpload.status}`);

  const pastDate = await org("/api/events", {
    method: "POST",
    form: eventForm({ eventDate: isoOffset(-3), title: "Past date test event" }),
  });
  check("past event date rejected", pastDate.status === 400, `status ${pastDate.status}`);

  const badTimes = await org("/api/events", {
    method: "POST",
    form: eventForm({ startTime: "14:00", endTime: "12:00", title: "Bad times test event" }),
  });
  check("end time before start rejected", badTimes.status === 400, `status ${badTimes.status}`);

  const negativePrice = await org("/api/events", {
    method: "POST",
    form: eventForm({ title: "Negative price event", ticketType: "paid", price: "-100", contactType: "phone", contactValue: "08031234567" }),
  });
  check("negative ticket price rejected", negativePrice.status === 400, `status ${negativePrice.status}`);

  const noContact = await org("/api/events", {
    method: "POST",
    form: eventForm({ title: "Paid without contact", ticketType: "paid", price: "500" }),
  });
  check("paid event without contact rejected", noContact.status === 400, `status ${noContact.status}`);

  const crossOrigin = await fetch(`${BASE}/api/registrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example", Cookie: "" },
    body: JSON.stringify({ eventId }),
  });
  check("cross-origin write blocked", crossOrigin.status === 403, `status ${crossOrigin.status}`);

  const adminAsStudent = await student("/api/admin/users/some-id/block", { method: "POST", json: { blocked: true } });
  check("students cannot use admin endpoints", adminAsStudent.status === 403, `status ${adminAsStudent.status}`);

  console.log("\nAdmin");
  const adminLogin = await admin("/api/auth/login", {
    method: "POST",
    json: { email: "admin@fulafia.edu.ng", password: "Admin12345!" },
  });
  check("admin can log in", adminLogin.status === 200 && adminLogin.data.role === "admin", JSON.stringify(adminLogin.data));

  for (const path of ["/admin", "/admin/users", "/admin/events", "/admin/reports", "/admin/messages"]) {
    const page = await admin(path);
    check(`admin page ${path} renders`, page.status === 200);
  }

  const feature = await admin(`/api/admin/events/${eventId}/feature`, { method: "POST", json: { featured: true } });
  check("admin can feature an event", feature.status === 200);
  const homeFeatured = await guest("/");
  check("featured event appears on the homepage", homeFeatured.text.includes("Quantum Computing"));

  const reportRow = await admin("/admin/reports?status=open");
  check("report appears in the admin queue", reportRow.text.includes("misleading") || reportRow.text.includes("Misleading"));

  const students = await admin(`/admin/users?q=${encodeURIComponent(studentEmail)}`);
  check("admin can find a user", students.text.includes(studentEmail));

  const studentIdMatch = students.text.match(/data-user-id="([^"]+)"/);
  if (studentIdMatch) {
    const studentRecordId = studentIdMatch[1];
    const blockResult = await admin(`/api/admin/users/${studentRecordId}/block`, {
      method: "POST",
      json: { blocked: true },
    });
    check("admin can suspend a user", blockResult.status === 200);

    const blockedLogin = await makeClient("blocked")("/api/auth/login", {
      method: "POST",
      json: { email: studentEmail, password: "Student123!" },
    });
    check("suspended user cannot log in", blockedLogin.status === 403, `status ${blockedLogin.status}`);

    const blockedTicket = await student("/api/registrations", { method: "POST", json: { eventId } });
    check("suspended user's session stops working", blockedTicket.status === 401, `status ${blockedTicket.status}`);

    const restore = await admin(`/api/admin/users/${studentRecordId}/block`, {
      method: "POST",
      json: { blocked: false },
    });
    check("admin can restore a user", restore.status === 200);

    const relogin = await student("/api/auth/login", {
      method: "POST",
      json: { email: studentEmail, password: "Student123!" },
    });
    check("restored user can log in again", relogin.status === 200, JSON.stringify(relogin.data));
  } else {
    check("admin can suspend a user", false, "user id not found in page markup");
  }

  console.log("\nCancellation");
  const cancel = await student(`/api/registrations/${ticketId}`, { method: "DELETE" });
  check("student can cancel a registration", cancel.status === 200, JSON.stringify(cancel.data));
  const afterCancel = await student("/tickets");
  check("cancelled ticket is marked cancelled", afterCancel.text.includes("Cancelled"));

  console.log("\nPassword reset");
  const forgot = await guest("/api/auth/forgot", { method: "POST", json: { email: studentEmail } });
  const resetUrl = forgot.data.resetUrl;
  check("reset link is created", forgot.status === 200 && typeof resetUrl === "string" && resetUrl.includes("token="), JSON.stringify(forgot.data));

  if (resetUrl) {
    const token = new URL(resetUrl).searchParams.get("token");
    const reset = await guest("/api/auth/reset", {
      method: "POST",
      json: { token, password: "NewPassword123!" },
    });
    check("password reset succeeds", reset.status === 200, JSON.stringify(reset.data));

    const newLogin = await makeClient("reset")("/api/auth/login", {
      method: "POST",
      json: { email: studentEmail, password: "NewPassword123!" },
    });
    check("student can log in with the new password", newLogin.status === 200, JSON.stringify(newLogin.data));

    const reuse = await guest("/api/auth/reset", {
      method: "POST",
      json: { token, password: "AnotherPassword123!" },
    });
    check("reset token cannot be reused", reuse.status === 400, `status ${reuse.status}`);
  }

  console.log(`\n${passed} checks passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("\nFailures:");
    for (const failure of failures) console.log(` - ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("\nFlow suite crashed:", error);
  process.exitCode = 1;
});
