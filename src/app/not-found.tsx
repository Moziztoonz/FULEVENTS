import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand-dark">
        <Icon name="search" size={26} />
      </span>
      <h1 className="mt-4 font-display text-3xl">We could not find that page</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
        The link may be broken, or the event may have been removed by its organiser.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/events" className="btn btn-primary">
          Browse events
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
