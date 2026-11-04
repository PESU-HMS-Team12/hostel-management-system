import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  DoorOpen,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { HmsShell } from "@/components/hms-shell";

const roleWorkspaces = [
  {
    title: "Student Dashboard",
    role: "STUDENT",
    href: "/dashboard/student",
    description:
      "View personal profile, current hostel and room assignment, check-in status, and historical room allocations.",
    badge: "Personal Accommodation",
  },
  {
    title: "Warden Workspace",
    role: "WARDEN",
    href: "/dashboard/warden",
    description:
      "Operational hub for student registration, hostel and room inventory, room allocations, transfers, and checkouts.",
    badge: "Operations & Inventory",
  },
  {
    title: "Administrator Console",
    role: "ADMINISTRATOR",
    href: "/dashboard/admin",
    description:
      "System-wide accommodation oversight, user account directory, HMS RBAC role assignment, and occupancy reporting.",
    badge: "System & Access Control",
  },
];

const modules = [
  {
    title: "Student directory",
    description:
      "Search, register, update and manage active or inactive student records.",
    icon: Users,
    label: "STUDENT RECORDS",
    href: "/students",
  },
  {
    title: "Hostel management",
    description:
      "Organize hostel blocks, campus locations, room counts and active status.",
    icon: Building2,
    label: "HOSTEL BLOCKS",
    href: "/hostels",
  },
  {
    title: "Room inventory",
    description:
      "Monitor room capacity, occupied beds, available beds and room status.",
    icon: DoorOpen,
    label: "ROOM INVENTORY",
    href: "/rooms",
  },
  {
    title: "Room allocations",
    description:
      "Execute room assignments, inter-room transfers, and student check-outs.",
    icon: ClipboardList,
    label: "ALLOCATIONS",
    href: "/allocations",
  },
  {
    title: "Reports & analytics",
    description:
      "Inspect real-time hostel bed utilization and program-wise allocation charts.",
    icon: ChartNoAxesCombined,
    label: "REPORTING",
    href: "/reports",
  },
  {
    title: "User & role management",
    description:
      "View registered accounts and assign Student, Warden, or Administrator roles.",
    icon: UserCheck,
    label: "ADMINISTRATION",
    href: "/admin/users",
  },
];

export default function Home() {
  return (
    <HmsShell breadcrumbs={[{ label: "Overview" }]}>
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
            A centralized workspace for managing student accommodation, hostel
            infrastructure, role-based operations and room allocations.
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
                Access role-specific workspaces for Students, Wardens and
                Administrators, or jump directly into an operational module.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/dashboard/warden"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[13px] font-semibold text-primary shadow-xs transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="size-4" />
                Open Warden Workspace
              </Link>

              <Link
                href="/dashboard/student"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
              >
                <BedDouble className="size-4" />
                Student Portal
              </Link>

              <Link
                href="/dashboard/admin"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/20"
              >
                <UserCheck className="size-4" />
                Administrator Console
              </Link>
            </div>
          </div>
        </section>

        {/* Role-based dashboards */}
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Role-based dashboards
              </h2>
              <p className="text-[15px] text-muted-foreground">
                Dedicated interfaces tailored to each HMS user role.
              </p>
            </div>

            <Link
              href="/dashboard"
              className="text-xs font-semibold text-primary hover:underline"
            >
              View dashboard hub
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {roleWorkspaces.map((ws) => (
              <Link
                key={ws.href}
                href={ws.href}
                className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-primary">
                      {ws.role}
                    </span>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {ws.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {ws.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-border/60 pt-3 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  {ws.badge} →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Core Modules */}
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold tracking-tight">
                Core modules
              </h2>
              <p className="text-[15px] text-muted-foreground">
                The main operational areas of the hostel management system.
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
                <Link
                  key={module.title}
                  href={module.href}
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
                </Link>
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
