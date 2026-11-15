import type { ReactNode } from "react";
import { Icon } from "./Icon";

export function EmptyState({
  icon = "calendar",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-white/60 px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand-dark">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
