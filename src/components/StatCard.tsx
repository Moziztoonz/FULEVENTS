import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: string;
  tone?: "default" | "brand" | "amber" | "blue";
}) {
  const tones = {
    default: "bg-page text-ink-soft",
    brand: "bg-brand-soft text-brand-dark",
    amber: "bg-amber-soft text-amber",
    blue: "bg-info-soft text-info",
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tones[tone])}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}
