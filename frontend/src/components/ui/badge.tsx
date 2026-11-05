import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "info";

const variantStyles: Record<BadgeVariant, string> = {
  default: "border-primary/25 bg-primary/10 text-primary",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger:
    "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  neutral: "border-border bg-muted/70 text-muted-foreground",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (
    normalized === "active" ||
    normalized === "available" ||
    normalized === "vacant"
  ) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (normalized === "partially occupied") {
    return <Badge variant="info">{status}</Badge>;
  }
  if (normalized === "full" || normalized === "completed") {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (
    normalized === "inactive" ||
    normalized === "unavailable" ||
    normalized === "maintenance"
  ) {
    return <Badge variant="danger">{status}</Badge>;
  }
  return <Badge variant="neutral">{status}</Badge>;
}
