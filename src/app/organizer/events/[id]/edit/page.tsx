import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventForm } from "@/components/organizer/EventForm";
import { Icon } from "@/components/Icon";
import { getEventById } from "@/lib/events";
import { requirePageUser } from "@/lib/page-auth";

export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser(["organizer", "admin"], `/organizer/events/${id}/edit`);
  const event = getEventById(id);
  if (!event) notFound();
  if (event.organizer_id !== user.id && user.role !== "admin") redirect("/organizer");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/organizer/events/${event.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <Icon name="chevronLeft" size={16} /> Back to event
      </Link>
      <header className="mb-5">
        <p className="eyebrow">Edit event</p>
        <h1 className="mt-1 font-display text-3xl">{event.title}</h1>
      </header>
      <EventForm
        mode="edit"
        initial={{
          id: event.id,
          title: event.title,
          category: event.category,
          description: event.description,
          eventDate: event.event_date,
          startTime: event.start_time,
          endTime: event.end_time,
          venue: event.venue,
          ticketType: event.ticket_type,
          price: event.price ? String(event.price) : "",
          capacity: event.capacity ? String(event.capacity) : "",
          registrationDeadline: event.registration_deadline ?? "",
          contactType: event.contact_type ?? "whatsapp",
          contactValue: event.contact_value ?? "",
          contactPhone: event.contact_phone ?? "",
          contactEmail: event.contact_email ?? "",
          flyerPath: event.flyer_path,
        }}
      />
    </div>
  );
}
