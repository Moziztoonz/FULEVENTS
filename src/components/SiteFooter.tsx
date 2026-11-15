import Link from "next/link";
import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-white pb-20 md:pb-0">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Brand />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            One place to see what is happening on campus at Federal University of Lafia, and to keep
            every ticket in your pocket.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink">Discover</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/events" className="hover:text-brand-dark">All events</Link></li>
            <li><Link href="/events?date=today" className="hover:text-brand-dark">Happening today</Link></li>
            <li><Link href="/events?date=week" className="hover:text-brand-dark">This week</Link></li>
            <li><Link href="/events?price=free" className="hover:text-brand-dark">Free events</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink">For organisers</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/register?role=organizer" className="hover:text-brand-dark">Create an organiser account</Link></li>
            <li><Link href="/organizer" className="hover:text-brand-dark">Organiser dashboard</Link></li>
            <li><Link href="/organizer/check-in" className="hover:text-brand-dark">Ticket check-in</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink">Good to know</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Payments happen directly with organisers.</li>
            <li>This platform never handles money.</li>
            <li>
              <Link href="/register" className="hover:text-brand-dark">Students register free</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Campus Events · Federal University of Lafia</p>
          <p>Built for students. Report anything that looks wrong.</p>
        </div>
      </div>
    </footer>
  );
}
