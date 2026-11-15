import Link from "next/link";
import { Icon } from "./Icon";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "See all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline"
        >
          {linkLabel}
          <Icon name="chevronRight" size={15} />
        </Link>
      )}
    </div>
  );
}
