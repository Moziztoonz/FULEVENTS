import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import type { RegistrationRow } from "./types";
import { formatDate, formatTime } from "./utils";

const GREEN = rgb(14 / 255, 107 / 255, 69 / 255);
const INK = rgb(16 / 255, 36 / 255, 27 / 255);
const MUTED = rgb(92 / 255, 107 / 255, 98 / 255);

/** PDF standard fonts only cover WinAnsi, so normalise fancy characters. */
function safe(text: string): string {
  return text
    .replace(/₦/g, "NGN ")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/·/g, "-")
    .replace(/[^\x20-\x7E\n]/g, "");
}

function wrap(text: string, font: { widthOfTextAtSize: (t: string, s: number) => number }, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildTicketPdf(ticket: RegistrationRow): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([420, 640]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  const { width, height } = page.getSize();
  const margin = 34;

  // Header band
  page.drawRectangle({ x: 0, y: height - 118, width, height: 118, color: GREEN });
  page.drawText("CAMPUS EVENTS", { x: margin, y: height - 44, size: 9, font: bold, color: rgb(1, 1, 1) });
  page.drawText("FEDERAL UNIVERSITY OF LAFIA", {
    x: margin,
    y: height - 58,
    size: 8,
    font: regular,
    color: rgb(0.85, 0.95, 0.88),
  });

  const titleLines = wrap(ticket.event_title ?? "Event ticket", bold, 20, width - margin * 2);
  titleLines.slice(0, 3).forEach((line, index) => {
    page.drawText(line, { x: margin, y: height - 86 - index * 22, size: 20, font: bold, color: rgb(1, 1, 1) });
  });

  let cursor = height - 150;

  // Attendee
  page.drawText("ATTENDEE", { x: margin, y: cursor, size: 8, font: bold, color: MUTED });
  page.drawText(safe(ticket.student_name ?? ""), { x: margin, y: cursor - 17, size: 15, font: bold, color: INK });
  cursor -= 48;

  const rows: Array<[string, string]> = [
    ["DATE", ticket.event_date ? formatDate(ticket.event_date) : "-"],
    ["TIME", ticket.start_time ? formatTime(ticket.start_time) : "-"],
    ["VENUE", ticket.venue ?? "-"],
    ["ORGANISER", ticket.organizer_name ?? "-"],
    [
      "STATUS",
      ticket.status === "confirmed" ? "Confirmed" : ticket.status === "pending_payment" ? "Pending payment" : "Cancelled",
    ],
  ];

  for (const [label, value] of rows) {
    page.drawText(label, { x: margin, y: cursor, size: 8, font: bold, color: MUTED });
    const lines = wrap(value, regular, 11, width - margin * 2);
    lines.slice(0, 2).forEach((line, index) => {
      page.drawText(line, { x: margin, y: cursor - 14 - index * 13, size: 11, font: regular, color: INK });
    });
    cursor -= 34 + Math.max(0, lines.slice(0, 2).length - 1) * 13;
  }

  // Ticket code panel
  const panelHeight = 118;
  page.drawRectangle({
    x: margin,
    y: 46,
    width: width - margin * 2,
    height: panelHeight,
    color: rgb(0.95, 0.97, 0.95),
    borderColor: rgb(0.87, 0.91, 0.87),
    borderWidth: 1,
  });

  const qrBuffer = await QRCode.toBuffer(ticket.ticket_code, {
    width: 520,
    margin: 1,
    color: { dark: "#10241b", light: "#ffffff" },
  });
  const qr = await doc.embedPng(qrBuffer);
  page.drawImage(qr, { x: margin + 12, y: 58, width: 96, height: 96 });

  page.drawText("TICKET CODE", {
    x: margin + 122,
    y: 132,
    size: 8,
    font: bold,
    color: MUTED,
  });
  page.drawText(ticket.ticket_code, { x: margin + 122, y: 98, size: 18, font: bold, color: GREEN });
  page.drawText("Show this code or the QR at the gate.", {
    x: margin + 122,
    y: 78,
    size: 9,
    font: regular,
    color: MUTED,
  });
  page.drawText("One entry per ticket.", { x: margin + 122, y: 64, size: 9, font: regular, color: MUTED });

  return doc.save();
}
