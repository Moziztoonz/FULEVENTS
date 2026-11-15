import type { Metadata } from "next";
import Link from "next/link";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { listEvents, type DateFilter, type PriceFilter, type SortOption } from "@/lib/events";
import { CATEGORIES } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Events",
  description: "Browse and filter every event published at Federal University of Lafia.",
};

const DATE_OPTIONS: Array<{ value: DateFilter; label: string }> = [
  { value: "upcoming", label: "All upcoming" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "Next 30 days" },
  { value: "past", label: "Past events" },
];

const PRICE_OPTIONS: Array<{ value: PriceFilter; label: string }> = [
  { value: "all", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "soonest", label: "Soonest first" },
  { value: "newest", label: "Newest added" },
];

function pick<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const q = single("q")?.slice(0, 100) ?? "";
  const category = single("category") ?? "all";
  const price = pick(single("price"), PRICE_OPTIONS.map((o) => o.value), "all");
  const date = pick(single("date"), DATE_OPTIONS.map((o) => o.value), "upcoming");
  const sort = pick(single("sort"), SORT_OPTIONS.map((o) => o.value), "soonest");
  const page = Math.max(Number(single("page") ?? 1) || 1, 1);

  const result = listEvents({ q, category, price, date, sort, page, perPage: 12 });

  const buildHref = (overrides: Record<string, string | number>) => {
    const next = new URLSearchParams();
    const current = { q, category, price, date, sort, page: String(result.page), ...overrides };
    for (const [key, value] of Object.entries(current)) {
      if (!value || value === "all" || (key === "page" && value === "1")) continue;
      next.set(key, String(value));
    }
    const query = next.toString();
    return query ? `/events?${query}` : "/events";
  };

  const hasFilters = Boolean(q) || category !== "all" || price !== "all" || date !== "upcoming" || sort !== "soonest";

  return (
    <div className="container-page py-6 sm:py-9">
      <header className="mb-6">
        <p className="eyebrow">Discover</p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl">Events at FULAFIA</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          Search by event or organiser, then narrow things down by date, price and category.
        </p>
      </header>

      <form action="/events" method="get" className="card mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="q" className="label">
              Search
            </label>
            <div className="relative">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-muted">
                <Icon name="search" size={18} />
              </span>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Event title or organiser"
                className="input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[38rem]">
            <div>
              <label htmlFor="category" className="label">
                Category
              </label>
              <select id="category" name="category" defaultValue={category} className="select">
                <option value="all">All</option>
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className="label">
                When
              </label>
              <select id="date" name="date" defaultValue={date} className="select">
                {DATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="price" className="label">
                Price
              </label>
              <select id="price" name="price" defaultValue={price} className="select">
                {PRICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="sort" className="label">
                Sort by
              </label>
              <select id="sort" name="sort" defaultValue={sort} className="select">
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            {result.total} {result.total === 1 ? "event" : "events"} found
          </p>
          <div className="flex gap-2">
            {hasFilters && (
              <Link href="/events" className="btn btn-secondary btn-sm">
                Clear
              </Link>
            )}
            <button type="submit" className="btn btn-primary btn-sm">
              Apply filters
            </button>
          </div>
        </div>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon="search"
          title={date === "past" ? "No past events yet" : "No events found. Try changing your filters."}
          body={
            date === "past"
              ? "Once events finish they will be listed here."
              : "Try a different category, a wider date range, or clear the search box."
          }
          action={
            hasFilters ? (
              <Link href="/events" className="btn btn-secondary">
                Clear filters
              </Link>
            ) : (
              <Link href="/" className="btn btn-secondary">
                Back to home
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {result.pages > 1 && (
        <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Pagination">
          {result.page > 1 ? (
            <Link href={buildHref({ page: result.page - 1 })} className="btn btn-secondary btn-sm">
              <Icon name="chevronLeft" size={16} /> Previous
            </Link>
          ) : (
            <span className="btn btn-secondary btn-sm cursor-not-allowed opacity-40" aria-disabled="true">
              <Icon name="chevronLeft" size={16} /> Previous
            </span>
          )}
          <p className="text-sm text-muted">
            Page {result.page} of {result.pages}
          </p>
          {result.page < result.pages ? (
            <Link href={buildHref({ page: result.page + 1 })} className="btn btn-secondary btn-sm">
              Next <Icon name="chevronRight" size={16} />
            </Link>
          ) : (
            <span className="btn btn-secondary btn-sm cursor-not-allowed opacity-40" aria-disabled="true">
              Next <Icon name="chevronRight" size={16} />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
