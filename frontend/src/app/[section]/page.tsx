import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  Users,
  Hotel,
  DoorOpen,
  ClipboardList,
  ChartNoAxesCombined,
  Settings,
} from "lucide-react";

import { HmsShell } from "@/components/hms-shell";

const sections = {
  students: {
    title: "Student directory",
    description:
      "Manage student records and access hostel-related information.",
    category: "STUDENT RECORDS",
    icon: Users,
  },
  hostels: {
    title: "Hostel management",
    description:
      "View and manage hostel buildings and accommodation information.",
    category: "ACCOMMODATION",
    icon: Hotel,
  },
  rooms: {
    title: "Room management",
    description:
      "Manage room inventory, capacity and availability.",
    category: "ROOM INVENTORY",
    icon: DoorOpen,
  },
  allocations: {
    title: "Room allocations",
    description:
      "Manage student room assignments, transfers and allocation history.",
    category: "ALLOCATION MANAGEMENT",
    icon: ClipboardList,
  },
  reports: {
    title: "Reports and analytics",
    description:
      "View hostel occupancy and student allocation summaries.",
    category: "REPORTING",
    icon: ChartNoAxesCombined,
  },
  settings: {
    title: "Settings",
    description:
      "Application preferences and workspace configuration.",
    category: "PREFERENCES",
    icon: Settings,
  },
} as const;

type SectionKey = keyof typeof sections;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({
    section,
  }));
}

export default function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return (
    <HmsShell>
      <Suspense
        fallback={
          <div className="space-y-8 animate-pulse">
            <div className="space-y-3">
              <div className="h-3 w-36 rounded bg-muted" />
              <div className="h-9 w-64 rounded bg-muted" />
              <div className="h-4 w-96 max-w-full rounded bg-muted" />
            </div>

            <div className="h-64 rounded-2xl border border-border bg-card" />
          </div>
        }
      >
        <SectionContent params={params} />
      </Suspense>
    </HmsShell>
  );
}

async function SectionContent({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  if (!Object.hasOwn(sections, section)) {
    notFound();
  }

  const page = sections[section as SectionKey];
  const Icon = page.icon;

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-[13px] font-semibold tracking-[0.14em] text-primary">
          {page.category}
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {page.title}
        </h1>

        <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground">
          {page.description}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-6" />
        </div>

        <div className="mt-6 space-y-2">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Interface foundation ready
          </span>

          <h2 className="text-xl font-semibold tracking-tight">
            {page.title} workspace
          </h2>

          <p className="max-w-xl text-[15px] leading-6 text-muted-foreground">
            This module has its own route and navigation state. Its
            operational interface, data tables, forms and workflows
            will be implemented in the HMS workflow phase.
          </p>
        </div>
      </section>
    </div>
  );
}