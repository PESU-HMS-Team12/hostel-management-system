
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  ClipboardList,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";

import { HmsShell } from "@/components/hms-shell";

const modules = [
  {
    title: "Student directory",
    description:
      "A centralized view of student records and hostel-related information.",
    icon: Users,
    label: "STUDENT RECORDS",
  },
  {
    title: "Hostels & rooms",
    description:
      "Organize hostel buildings, room inventory and accommodation details.",
    icon: Building2,
    label: "ACCOMMODATION",
  },
  {
    title: "Room allocations",
    description:
      "A structured workspace for student room assignments and allocation records.",
    icon: ClipboardList,
    label: "ALLOCATIONS",
  },
];

export default function Home() {
  return (
    <HmsShell>
      <div className="space-y-9">
        {/* Page introduction */}
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[13px] font-semibold tracking-[0.14em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            CAMPUS WORKSPACE
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Hostel Management
          </h1>

          <p className="max-w-2xl text-[15px] leading-6 text-muted-foreground sm:text-base">
            A centralized workspace for managing student accommodation,
            hostel infrastructure and room allocations.
          </p>
        </section>

        {/* Welcome panel */}
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 -top-12 size-52 rounded-full border border-white/10" />

          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[13px] font-medium">
              <GraduationCap className="size-4" />
              PES University
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Welcome to your campus workspace.
              </h2>

              <p className="max-w-xl text-[15px] leading-6 text-primary-foreground/90 sm:text-base">
                Bring hostel administration into one organized environment.
                Find the tools and information needed to manage accommodation
                efficiently.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-medium">
                <ShieldCheck className="size-4" />
                Centralized management
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-medium">
                <BedDouble className="size-4" />
                Accommodation workspace
              </div>
            </div>
          </div>
        </section>

        {/* Modules */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Core modules
              </h2>
              <p className="text-[15px] text-muted-foreground">
                The main areas of the hostel management system.
              </p>
            </div>

            <span className="hidden text-[13px] text-muted-foreground sm:block">
              HMS workspace
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <article
                  key={module.title}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </div>

                    <ArrowUpRight className="size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </div>

                  <div className="mt-7 space-y-2">
                    <p className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground">
                      {module.label}
                    </p>

                    <h3 className="text-base font-semibold tracking-tight">
                      {module.title}
                    </h3>

                    <p className="text-[15px] leading-6 text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer note */}
        <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-5 sm:flex-row sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="size-5" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-[15px] font-semibold">
              One workspace. Connected hostel operations.
            </h3>
            <p className="text-[13px] leading-5 text-muted-foreground">
              Designed as a consistent interface for student information,
              accommodation management and allocation workflows.
            </p>
          </div>
        </section>
      </div>
    </HmsShell>
  );
}
