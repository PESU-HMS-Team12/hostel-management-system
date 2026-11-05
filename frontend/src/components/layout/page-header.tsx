import type { ReactNode } from "react";

export interface PageHeaderProps {
  category: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({
  category,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[12px] font-bold tracking-[0.15em] uppercase text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          {category}
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
          {description}
        </p>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </section>
  );
}
