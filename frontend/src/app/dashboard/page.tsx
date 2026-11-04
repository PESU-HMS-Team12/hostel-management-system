import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  ClipboardList,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { HmsShell } from "@/components/hms-shell";
import { PageHeader } from "@/components/layout/page-header";

const roleCards = [
  {
    role: "STUDENT",
    title: "Student Dashboard",
    route: "/dashboard/student",
    icon: BedDouble,
    description:
      "Personal profile, current hostel and room assignment, check-in status, and personal allocation history.",
    highlights: [
      "Strict student record isolation",
      "Current room & hostel details",
      "Historical allocation timeline",
    ],
  },
  {
    role: "WARDEN",
    title: "Warden Dashboard",
    route: "/dashboard/warden",
    icon: ClipboardList,
    description:
      "Operational workspace for managing students, hostel blocks, rooms, allocations, transfers, and vacations.",
    highlights: [
      "Student & room inventory management",
      "Atomic room allocation & transfer workflows",
      "Real-time hostel occupancy overview",
    ],
  },
  {
    role: "ADMINISTRATOR",
    title: "Administrator Dashboard",
    route: "/dashboard/admin",
    icon: UserCheck,
    description:
      "System-wide metrics, full Warden operational capabilities, user account listing, and HMS role assignment.",
    highlights: [
      "System-wide capacity & user summaries",
      "Registered user account directory",
      "RBAC role assignment with student link validation",
    ],
  },
];

export default function DashboardHubPage() {
  return (
    <HmsShell breadcrumbs={[{ label: "Dashboards" }]}>
      <div className="space-y-8">
        <PageHeader
          category="ROLE-BASED WORKSPACES"
          title="HMS Dashboard Hub"
          description="Select a role-based workspace below. In production mode, backend session authorization (/api/v1/auth/me/) enforces access permissions for every endpoint."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {roleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.route}
                href={card.route}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                      {card.role}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                      <span>{card.title}</span>
                      <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {card.description}
                    </p>
                  </div>

                  <ul className="space-y-1.5 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                    {card.highlights.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 rounded-xl bg-secondary px-3.5 py-2 text-center text-xs font-semibold text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  Open {card.title} ({card.route})
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </HmsShell>
  );
}
