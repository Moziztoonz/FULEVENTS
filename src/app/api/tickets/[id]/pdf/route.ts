import { HttpError, requireUser, route } from "@/lib/api";
import { getTicketForUser } from "@/lib/ticketing";
import { buildTicketPdf } from "@/lib/ticket-pdf";

export const GET = route(async (_request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const user = await requireUser();
  const ticket = getTicketForUser(user.id, id, user.role === "admin");
  if (!ticket) throw new HttpError(404, "We could not find that ticket.");
  if (ticket.status === "cancelled") {
    throw new HttpError(400, "This ticket was cancelled, so there is nothing to download.");
  }

  const pdf = await buildTicketPdf(ticket);
  const fileName = `fulafia-ticket-${ticket.ticket_code}.pdf`;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
});
