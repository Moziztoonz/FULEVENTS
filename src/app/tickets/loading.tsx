export default function TicketsLoading() {
  return (
    <div className="container-page max-w-4xl py-6 sm:py-9" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your tickets…</span>
      <div className="mb-6 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-48" />
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex items-center gap-4 rounded-3xl border border-line bg-white p-4">
            <div className="skeleton h-20 w-20 rounded-xl sm:h-24 sm:w-28" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
              <div className="skeleton h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
