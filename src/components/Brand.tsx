import Link from "next/link";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Campus Events home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M7 10.5V16c0 1.6 2.2 3 5 3s5-1.4 5-3v-5.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-display text-[1.05rem] font-semibold text-ink">Campus Events</span>
          <span className="block text-[0.65rem] font-semibold tracking-[0.12em] text-muted uppercase">
            FULAFIA
          </span>
        </span>
      )}
    </Link>
  );
}
