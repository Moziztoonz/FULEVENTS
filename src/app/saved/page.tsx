import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { getCurrentUser } from "@/lib/auth";
import { listSavedEvents } from "@/lib/events";

export const metadata: Metadata = { title: "Saved events" };

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/saved");

  const events = listSavedEvents(user.id);

  return (
    <div className="container-page py-6 sm:py-9">
      <header className="mb-6">
        <p className="eyebrow">Shortlist</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Saved events</h1>
        <p className="mt-1.5 text-sm text-muted">
          Keep an eye on the ones you are still deciding about.
        </p>
      </header>

      {events.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Nothing saved yet"
          body="Tap Save on any event and it will wait for you here."
          action={
            <Link href="/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
