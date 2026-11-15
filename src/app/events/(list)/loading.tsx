export default function EventsLoading() {
  return (
    <div className="container-page py-6 sm:py-9" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading events…</span>
      <div className="mb-6 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-4 w-80" />
      </div>
      <div className="skeleton mb-6 h-32 w-full rounded-3xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="skeleton aspect-[16/10] w-full rounded-none" />
            <div className="space-y-2.5 p-4">
              <div className="skeleton h-3 w-20" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
