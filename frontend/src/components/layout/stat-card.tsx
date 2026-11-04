import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/25">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          {label}
        </p>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </article>
  );
}
