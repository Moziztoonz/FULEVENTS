import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Variant = "success" | "error" | "info" | "warning";

const styles: Record<Variant, { wrap: string; icon: string }> = {
  success: { wrap: "border-[#bfe2cd] bg-brand-soft text-brand-dark", icon: "check" },
  error: { wrap: "border-[#f2cbc7] bg-danger-soft text-danger", icon: "alert" },
  info: { wrap: "border-[#c9dbf5] bg-info-soft text-info", icon: "bell" },
  warning: { wrap: "border-[#f2dfbd] bg-amber-soft text-amber", icon: "alert" },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const style = styles[variant];
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm", style.wrap, className)}
    >
      <Icon name={style.icon} size={17} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("leading-relaxed", title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
