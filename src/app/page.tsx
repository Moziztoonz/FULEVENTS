import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { SectionHeading } from "@/components/SectionHeading";
import { listEvents, listFeatured, listPast } from "@/lib/events";
import { categoryCounts, publicStats } from "@/lib/stats";
import { CATEGORIES, formatDateShort, formatTime, priceLabel, todayISO } from "@/lib/utils";

export default function HomePage() {
  const stats = publicStats();
  const counts = categoryCounts();

  const featured = listFeatured(3);
  const today = listEvents({ date: "today", perPage: 6 }).items;
  const week = listEvents({ date: "week", perPage: 8 }).items;
  const recent = listEvents({ sort: "newest", perPage: 8 }).items;
  const past = listPast(4);
  const nextUp = listEvents({ perPage: 1 }).items[0];

  const shown = new Set<string>([...featured, ...today].map((event) => event.id));
  const weekOnly = week.filter((event) => !shown.has(event.id) && event.event_date !== todayISO()).slice(0, 4);
  weekOnly.forEach((event) => shown.add(event.id));
  const recentOnly = recent.filter((event) => !shown.has(event.id)).slice(0, 4);
  const nothingAtAll = stats.upcoming === 0 && past.length === 0;

  return (
    <div className="pb-4">
      <section className="container-page pt-5 sm:pt-8">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-[linear-gradient(135deg,#0a5136_0%,#0e6b45_52%,#157d55_100%)] px-5 py-9 text-white sm:rounded-[2.25rem] sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 88% 10%, rgba(217,240,196,0.35) 0, transparent 38%), radial-gradient(circle at 8% 92%, rgba(127,211,164,0.28) 0, transparent 42%)",
            }}
          />
          <div className="relative max-w-2xl lg:max-w-[36rem]">
            <p className="text-[0.7rem] font-bold tracking-[0.16em] text-white/70 uppercase">
              Federal University of Lafia
            </p>
            <h1 className="mt-2.5 font-display text-[2.1rem] leading-[1.06] text-white sm:text-[3.1rem]">
              Find what&apos;s happening on campus.
            </h1>
            <p className="mt-3 max-w-lg text-[0.95rem] leading-relaxed text-white/80 sm:text-base">
              Seminars, matches, concerts and career fairs, all in one place. Register in a few taps
              and keep every ticket on your phone.
            </p>

            <form action="/events" method="get" role="search" className="mt-6 max-w-xl">
              <label htmlFor="home-search" className="sr-only">
                Search events
              </label>
              <div className="flex items-center gap-2 rounded-full bg-white p-1.5 shadow-lg shadow-black/10">
                <span className="pl-3 text-muted">
                  <Icon name="search" size={18} />
                </span>
                <input
                  id="home-search"
                  name="q"
                  type="search"
                  placeholder="Try &quot;career fair&quot; or &quot;football&quot;"
                  className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] text-ink placeholder:text-muted/80 focus:outline-none"
                />
                <button type="submit" className="btn btn-primary px-4 py-2">
                  Search
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {[
                { href: "/events?date=today", label: "Today" },
                { href: "/events?date=week", label: "This week" },
                { href: "/events?price=free", label: "Free events" },
              ].map((chip) => (
                <Link
                  key={chip.href}
                  href={chip.href}
                  className="rounded-full border border-white/25 px-3 py-1.5 text-[0.8rem] font-semibold text-white/90 hover:bg-white/10"
                >
                  {chip.label}
                </Link>
              ))}
            </div>

            <p className="mt-6 text-[0.8rem] font-medium text-white/70">
              {stats.upcoming} upcoming {stats.upcoming === 1 ? "event" : "events"} · {stats.thisWeek} this week ·{" "}
              {stats.free} free to attend
            </p>
          </div>

          {nextUp && (
            <Link
              href={`/events/${nextUp.id}`}
              className="absolute top-1/2 right-8 hidden w-72 -translate-y-1/2 rounded-3xl bg-white p-3 text-ink shadow-2xl shadow-black/25 transition-transform hover:-translate-y-[calc(50%+4px)] lg:block"
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <span className="text-[0.65rem] font-bold tracking-[0.12em] text-muted uppercase">Next up</span>
                <span className="chip badge-green">{priceLabel(nextUp.ticket_type, nextUp.price)}</span>
              </div>
              <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-brand-soft">
                {nextUp.flyer_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${nextUp.flyer_path}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="mt-2.5 line-clamp-2 px-1 text-sm leading-snug font-bold">{nextUp.title}</p>
              <p className="mt-1 flex items-center gap-1.5 px-1 text-xs text-muted">
                <Icon name="calendar" size={13} className="text-brand" />
                {formatDateShort(nextUp.event_date)} · {formatTime(nextUp.start_time)}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 px-1 pb-1 text-xs text-muted">
                <Icon name="pin" size={13} className="text-brand" />
                <span className="truncate">{nextUp.venue}</span>
              </p>
            </Link>
          )}
        </div>
      </section>

      <div className="container-page mt-10 space-y-12">
        {nothingAtAll && (
          <section>
            <EmptyState
              icon="calendar"
              title="No events yet"
              body="As soon as organisers publish events they will show up here. Are you running something on campus?"
              action={
                <Link href="/register?role=organizer" className="btn btn-primary">
                  Create an organiser account
                </Link>
              }
            />
          </section>
        )}

        {featured.length > 0 && (
          <section aria-labelledby="featured-heading">
            <SectionHeading
              eyebrow="Picked for you"
              title="Featured events"
              description="A few events worth clearing your timetable for."
              href="/events"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((event, index) => (
                <EventCard key={event.id} event={event} priority={index === 0} />
              ))}
            </div>
          </section>
        )}

        {today.length > 0 && (
          <section aria-labelledby="today-heading">
            <SectionHeading
              eyebrow="Happening today"
              title="Today on campus"
              description="Events start in a few hours. Grab a ticket before you head out."
              href="/events?date=today"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {today.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {weekOnly.length > 0 && (
          <section aria-labelledby="week-heading">
            <SectionHeading
              eyebrow="Next seven days"
              title="This week"
              description="Plan ahead without digging through flyers on WhatsApp."
              href="/events?date=week"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {weekOnly.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="categories-heading">
          <SectionHeading eyebrow="Browse by interest" title="Categories" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.value}
                href={`/events?category=${category.value}`}
                className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 transition-colors hover:border-brand-ring hover:bg-brand-soft/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark">
                  <Icon name={category.icon} size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-ink">{category.label}</span>
                  <span className="block truncate text-xs text-muted">
                    {counts[category.value] ?? 0} upcoming
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {recentOnly.length > 0 && (
          <section aria-labelledby="recent-heading">
            <SectionHeading
              eyebrow="Just added"
              title="Recently posted"
              description="Fresh events from organisers around campus."
              href="/events?sort=newest"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {recentOnly.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-line bg-white p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow">For organisers</p>
              <h2 className="section-title mt-1">Running something on campus?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Put your event in front of students, track who is coming, confirm payments and scan
                tickets at the gate. No fees, no middleman.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link href="/register?role=organizer" className="btn btn-primary">
                Create an organiser account
              </Link>
              <Link href="/organizer" className="btn btn-secondary">
                Organiser dashboard
              </Link>
            </div>
          </div>
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past-heading">
            <SectionHeading
              eyebrow="Archive"
              title="Past events"
              description="A look at what already happened this session."
              href="/events?date=past"
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 opacity-90">
              {past.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
