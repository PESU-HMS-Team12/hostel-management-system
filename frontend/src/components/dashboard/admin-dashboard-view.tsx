"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  DoorOpen,
  KeyRound,
  Percent,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { useHmsData } from "@/lib/api/hms-provider";

export function AdminDashboardView() {
  const {
    students,
    hostels,
    rooms,
    allocations,
    users,
    occupancyReport,
    isLoading,
  } = useHmsData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const activeAllocations = allocations.filter((a) => a.is_active).length;

  const adminCount = users.filter((u) => u.role === "ADMINISTRATOR").length;
  const wardenCount = users.filter((u) => u.role === "WARDEN").length;
  const studentAccountCount = users.filter((u) => u.role === "STUDENT").length;
  const unassignedCount = users.filter((u) => !u.role).length;

  return (
    <div className="space-y-8">
      <PageHeader
        category="ADMINISTRATOR CONSOLE"
        title="System Administration Dashboard"
        description="System-wide accommodation oversight, user account directory, HMS RBAC role distribution, and full operational controls."
        actions={
          <>
            <Link
              href="/admin/users"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <KeyRound className="size-3.5" />
              User &amp; Role Management
            </Link>
            <Link
              href="/reports"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <ChartNoAxesCombined className="size-3.5" />
              System Reports
            </Link>
          </>
        }
      />

      {/* System-wide Summary Cards */}
      <section
        aria-label="Administrator system summary metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <StatCard
          label="Students"
          value={students.length}
          subtitle={`${students.filter((s) => s.status === "Active").length} active records`}
          icon={Users}
        />
        <StatCard
          label="Hostels"
          value={hostels.length}
          subtitle={`${hostels.filter((h) => h.status === "Active").length} active blocks`}
          icon={Building2}
        />
        <StatCard
          label="Rooms"
          value={rooms.length}
          subtitle={`${occupancyReport.total_capacity} total beds`}
          icon={DoorOpen}
        />
        <StatCard
          label="Active Allocations"
          value={activeAllocations}
          subtitle={`${occupancyReport.total_available_beds} beds available`}
          icon={ClipboardList}
        />
        <StatCard
          label="Occupancy"
          value={`${occupancyReport.overall_occupancy_rate}%`}
          subtitle={`${occupancyReport.total_occupied_beds}/${occupancyReport.total_capacity} beds`}
          icon={Percent}
        />
        <StatCard
          label="User Accounts"
          value={users.length}
          subtitle={`${users.filter((u) => u.is_active).length} active accounts`}
          icon={UserCheck}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Role Distribution */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                HMS Role Distribution
              </h2>
              <p className="text-xs text-muted-foreground">
                RBAC assignments across registered accounts
              </p>
            </div>
            <Link
              href="/admin/users#role-management"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Assign roles
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3.5">
            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <Badge variant="default">ADMINISTRATOR</Badge>
              <p className="mt-2.5 text-2xl font-bold text-foreground">
                {adminCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Full system &amp; RBAC control
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <Badge variant="info">WARDEN</Badge>
              <p className="mt-2.5 text-2xl font-bold text-foreground">
                {wardenCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Hostel &amp; allocation staff
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <Badge variant="success">STUDENT</Badge>
              <p className="mt-2.5 text-2xl font-bold text-foreground">
                {studentAccountCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Linked to student records
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/50 p-4">
              <Badge variant="warning">UNASSIGNED</Badge>
              <p className="mt-2.5 text-2xl font-bold text-foreground">
                {unassignedCount}
              </p>
              <p className="text-xs text-muted-foreground">
                Awaiting role assignment
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span>
              All role assignments are audited in compliance with{" "}
              <strong>HMS-SR-005 (TC-SEC-05)</strong>.
            </span>
          </div>
        </section>

        {/* Registered User Accounts Preview */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Registered User Accounts
              </h2>
              <p className="text-xs text-muted-foreground">
                System accounts and linked student profiles
              </p>
            </div>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Manage all users
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 pr-4">Username</th>
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Linked Student</th>
                  <th className="pb-3 pl-3 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="py-3 pr-4">
                      <p className="font-mono text-xs font-semibold text-foreground">
                        {u.username}
                      </p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3 px-3 font-medium text-foreground">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="py-3 px-3">
                      {u.role ? (
                        <Badge
                          variant={
                            u.role === "ADMINISTRATOR"
                              ? "default"
                              : u.role === "WARDEN"
                                ? "info"
                                : "success"
                          }
                        >
                          {u.role}
                        </Badge>
                      ) : (
                        <Badge variant="warning">Unassigned</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-muted-foreground">
                      {u.student_id ?? "—"}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusBadge
                        status={u.is_active ? "Active" : "Inactive"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Warden-level Management Capabilities */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Administrative &amp; Warden Management Modules
            </h2>
            <p className="text-xs text-muted-foreground">
              Administrators hold full Warden operational permissions alongside
              system user and role management.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Link
            href="/students"
            className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span>Students</span>
            <Users className="size-4 text-primary" />
          </Link>
          <Link
            href="/hostels"
            className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span>Hostels</span>
            <Building2 className="size-4 text-primary" />
          </Link>
          <Link
            href="/rooms"
            className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span>Rooms</span>
            <DoorOpen className="size-4 text-primary" />
          </Link>
          <Link
            href="/allocations"
            className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span>Allocations</span>
            <ClipboardList className="size-4 text-primary" />
          </Link>
          <Link
            href="/reports"
            className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3.5 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
          >
            <span>Reports</span>
            <ChartNoAxesCombined className="size-4 text-primary" />
          </Link>
          <Link
            href="/admin/users"
            className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <span>Users &amp; Roles</span>
            <KeyRound className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
