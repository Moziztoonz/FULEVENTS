import { HttpError, requireUser, route } from "@/lib/api";
import { getEventById } from "@/lib/events";
import { eventAttendees } from "@/lib/ticketing";
import { nowISO } from "@/lib/utils";

function cell(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  // Stop spreadsheet apps from treating attendee input as formulas.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const GET = route(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser(["organizer", "admin"]);
  const event = getEventById(id);
  if (!event) throw new HttpError(404, "We could not find that event.");
  if (event.organizer_id !== user.id && user.role !== "admin") {
    throw new HttpError(403, "Only the organiser can download this attendee list.");
  }

  const attendees = eventAttendees(id);
  const header = [
    "Student name",
    "Email",
    "Phone",
    "Ticket code",
    "Registration status",
    "Registered at",
    "Payment confirmed at",
    "Checked in at",
  ];

  const rows = attendees.map((row) =>
    [
      cell(row.student_name),
      cell(row.student_email),
      cell(row.student_phone ?? ""),
      cell(row.ticket_code),
      cell(row.status === "confirmed" ? "Confirmed" : row.status === "pending_payment" ? "Pending payment" : "Cancelled"),
      cell(row.registered_at),
      cell(row.payment_confirmed_at ?? ""),
      cell(row.checked_in_at ?? ""),
    ].join(","),
  );

  const csv = [header.map(cell).join(","), ...rows].join("\r\n");
  const fileName = `attendees-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${nowISO().slice(0, 10)}.csv`;

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
});
