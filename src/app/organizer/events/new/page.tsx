import type { Metadata } from "next";
import { EventForm } from "@/components/organizer/EventForm";
import { requirePageUser } from "@/lib/page-auth";

export const metadata: Metadata = { title: "Create an event" };

export default async function NewEventPage() {
  const user = await requirePageUser(["organizer", "admin"], "/organizer/events/new");

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-5">
        <p className="eyebrow">New event</p>
        <h1 className="mt-1 font-display text-3xl">Create an event</h1>
        <p className="mt-1.5 text-sm text-muted">
          Fill this in once. You can edit anything later, even after publishing.
        </p>
      </header>
      <EventForm
        mode="create"
        initial={{
          contactPhone: user.contactPhone ?? user.phone ?? "",
          contactEmail: user.contactEmail ?? user.email,
        }}
      />
    </div>
  );
}
