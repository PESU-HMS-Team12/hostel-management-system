"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BedDouble,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  DoorOpen,
  Percent,
  Plus,
  UserCheck,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { useHmsData } from "@/lib/api/hms-provider";

export function WardenDashboardView() {
  const {
    students,
    hostels,
    rooms,
    roomAvailability,
    allocations,
    occupancyReport,
    isLoading,
  } = useHmsData();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="h-20 rounded-2xl bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
          <div className="h-28 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => s.status === "Active").length;
  const totalHostels = hostels.length;
  const totalRooms = rooms.length;
  const activeAllocations = allocations.filter((a) => a.is_active).length;
  const availableBeds = occupancyReport.total_available_beds;
  const overallOccupancy = `${occupancyReport.overall_occupancy_rate}%`;

  const vacantRooms = roomAvailability.filter(
    (r) => r.availability_label === "Vacant"
  ).length;
  const partialRooms = roomAvailability.filter(
    (r) => r.availability_label === "Partially occupied"
  ).length;
  const fullRooms = roomAvailability.filter(
    (r) => r.availability_label === "Full"
  ).length;
  const unavailableRooms = rooms.filter(
    (r) => r.status !== "Available"
  ).length;

  const recentAllocations = allocations.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        category="WARDEN WORKSPACE"
        title="Hostel Operations Dashboard"
        description="Monitor student accommodation capacity, active room assignments, and hostel block utilization across PES University."
        actions={
          <>
            <Link
              href="/students/new"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
            >
              <Plus className="size-3.5" />
              Register Student
            </Link>
            <Link
              href="/allocations"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ClipboardList className="size-3.5" />
              Manage Allocations
            </Link>
          </>
        }
      />

      {/* 7 Required Summary Cards */}
      <section
        aria-label="Warden operational summary metrics"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
      >
        <StatCard
          label="Total Students"
          value={totalStudents}
          subtitle="Registered directory"
          icon={Users}
        />
        <StatCard
          label="Active Students"
          value={activeStudents}
          subtitle="Eligible for housing"
          icon={UserCheck}
        />
        <StatCard
          label="Total Hostels"
          value={totalHostels}
          subtitle="Campus blocks"
          icon={Building2}
        />
        <StatCard
          label="Total Rooms"
          value={totalRooms}
          subtitle={`${occupancyReport.total_capacity} total beds`}
          icon={DoorOpen}
        />
        <StatCard
          label="Active Allocations"
          value={activeAllocations}
          subtitle="Currently checked in"
          icon={ClipboardList}
        />
        <StatCard
          label="Available Beds"
          value={availableBeds}
          subtitle="Ready for assignment"
          icon={BedDouble}
        />
        <StatCard
          label="Overall Occupancy"
          value={overallOccupancy}
          subtitle={`${occupancyReport.total_occupied_beds}/${occupancyReport.total_capacity} beds`}
          icon={Percent}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Hostel Occupancy Overview */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-xs lg:col-span-7">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Hostel Occupancy Overview
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time bed utilization across hostel blocks
              </p>
            </div>
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Full reports
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {occupancyReport.hostels.map((h) => (
              <div
                key={h.hostel_id}
                className="rounded-xl border border-border/70 bg-background/50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {h.hostel_name}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        ({h.hostel_id})
                      </span>
                      <StatusBadge status={h.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {h.total_rooms} rooms · {h.occupied_beds} occupied ·{" "}
                      {h.available_beds} available of {h.total_capacity} beds
                    </p>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {h.occupancy_rate}%
                  </span>
                </div>

                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, h.occupancy_rate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Room Availability Summary & Quick Shortcuts */}
        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Room Availability Summary
                </h2>
                <p className="text-xs text-muted-foreground">
                  Inventory breakdown by occupancy state
                </p>
              </div>
              <Link
                href="/rooms"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View rooms
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
                <Badge variant="success">Vacant</Badge>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {vacantRooms}
                </p>
                <p className="text-xs text-muted-foreground">
                  0 occupied beds
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
                <Badge variant="info">Partially occupied</Badge>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {partialRooms}
                </p>
                <p className="text-xs text-muted-foreground">
                  Beds still available
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
                <Badge variant="warning">Full</Badge>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {fullRooms}
                </p>
                <p className="text-xs text-muted-foreground">
                  At maximum capacity
                </p>
              </div>

              <div className="rounded-xl border border-border/70 bg-background/50 p-3.5">
                <Badge variant="danger">Unavailable</Badge>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {unavailableRooms}
                </p>
                <p className="text-xs text-muted-foreground">
                  Maintenance / inactive
                </p>
              </div>
            </div>
          </section>

          {/* Operational Shortcuts */}
          <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <h2 className="text-base font-semibold tracking-tight">
              Core Operational Shortcuts
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct access to Warden management workflows
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/students"
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span>Student Directory</span>
                <Users className="size-4 text-primary" />
              </Link>
              <Link
                href="/hostels"
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span>Hostel Blocks</span>
                <Building2 className="size-4 text-primary" />
              </Link>
              <Link
                href="/rooms"
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span>Room Inventory</span>
                <DoorOpen className="size-4 text-primary" />
              </Link>
              <Link
                href="/reports"
                className="flex items-center justify-between rounded-xl border border-border bg-background/60 p-3 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <span>Occupancy Reports</span>
                <ChartNoAxesCombined className="size-4 text-primary" />
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Recent Allocation Activity */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Recent Allocation Activity
            </h2>
            <p className="text-xs text-muted-foreground">
              Latest room assignments, transfers, and check-outs
            </p>
          </div>
          <Link
            href="/allocations"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all allocations
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 px-4">Hostel &amp; Room</th>
                <th className="pb-3 px-4">Allocation Date</th>
                <th className="pb-3 px-4">Check-In Date</th>
                <th className="pb-3 pl-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {recentAllocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-muted/30">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-foreground">
                      {alloc.student_name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {alloc.student_id}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-foreground">
                      {alloc.hostel_name} · Room {alloc.room_no}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alloc.room_type}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {alloc.allocation_date}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {alloc.check_in_date ?? "—"}
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <StatusBadge
                      status={alloc.is_active ? "Active" : "Completed"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
